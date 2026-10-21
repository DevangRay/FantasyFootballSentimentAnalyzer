from sentence_transformers import CrossEncoder
import numpy as np
import statistics
import utils.context_window as context_window

# nli-deberta-v3-small: ~180MB vs ~700MB for base — fits within Railway's 2GB limit
model = CrossEncoder('cross-encoder/nli-deberta-v3-small')

CANDIDATE_LABELS = ["positive", "negative", "neutral"]
MAX_PLAYERS = 50
MAX_SENTENCES_PER_PLAYER = 20
BATCH_SIZE = 64
ENTAILMENT_COL = model.config.label2id['entailment']
NUM_LABELS = len(CANDIDATE_LABELS)


def _make_hypothesis(player, label):
    if label == "positive":
        return f"{player} will perform at a high level or positively influence fantasy points."
    elif label == "negative":
        return f"{player} will perform at a low level or negatively impact fantasy points."
    else:
        return f"{player} will perform as average or neutrally impact fantasy points."


def _aggregate_player_result(final_player_object, player, texts, entailment_scores):
    """entailment_scores: shape (len(texts), NUM_LABELS) — this player's slice of a batched predict() call."""
    results = []
    for text, scores_for_sentence in zip(texts, entailment_scores):
        best_idx = int(np.argmax(scores_for_sentence))
        results.append({
            "text": text,
            "scores": {label: float(score) for label, score in zip(CANDIDATE_LABELS, scores_for_sentence)},
            "best_label": CANDIDATE_LABELS[best_idx]
        })

    scores_matrix = np.array([list(r["scores"].values()) for r in results])
    average_scores = np.mean(scores_matrix, axis=0)
    label_array = [CANDIDATE_LABELS[int(np.argmax(s))] for s in scores_matrix]

    return {
        "sentiment_consensus": {label: float(score) for label, score in zip(CANDIDATE_LABELS, average_scores)},
        "average_label": CANDIDATE_LABELS[int(np.argmax(average_scores))],
        "most_frequent_label": statistics.mode(label_array),
        "detailed_sentiment": results,
        "status": final_player_object[player]['occurrence_array'][0]['status'],
        "transcript_name": final_player_object[player]['occurrence_array'][0]['transcript_name'],
        "player_id": final_player_object[player]['occurrence_array'][0]['player_id'],
        "player_team": final_player_object[player]['occurrence_array'][0]['player_team'],
    }


def analyze_sentiment(final_player_object: dict, raw_sentences: list[str]):
    """
    Yields (player_name, player_result, current_index, total) so callers can emit SSE
    heartbeats between players and prevent proxy timeouts.

    Internally, players are grouped into chunks so that each chunk's combined pair count
    stays near BATCH_SIZE, and one model.predict() call scores the whole chunk at once —
    this keeps the number of forward passes far below "one per player" while still yielding
    progress as soon as each individual player's slice of the chunk is read back out.
    """
    sorted_players = sorted(
        final_player_object.keys(),
        key=lambda p: len(final_player_object[p]['mentioned_sentence_indexes']),
        reverse=True
    )[:MAX_PLAYERS]

    # Pre-build each player's context-window texts once; drop players with nothing to score
    # so `total` always matches the number of players we actually yield.
    player_texts = {}
    for player in sorted_players:
        indexes = list(final_player_object[player]['mentioned_sentence_indexes'])[:MAX_SENTENCES_PER_PLAYER]
        texts = [context_window.get_context_window(idx, raw_sentences, window_size=2) for idx in indexes]
        if texts:
            player_texts[player] = texts

    players = list(player_texts.keys())
    total = len(players)

    completed = 0
    cursor = 0
    while cursor < total:
        # Greedily add players to this chunk until adding one more would exceed BATCH_SIZE pairs.
        chunk_players = []
        chunk_pair_count = 0
        while cursor < total:
            player = players[cursor]
            pair_count = len(player_texts[player]) * NUM_LABELS
            if chunk_players and chunk_pair_count + pair_count > BATCH_SIZE:
                break
            chunk_players.append(player)
            chunk_pair_count += pair_count
            cursor += 1

        chunk_pairs = [
            (text, _make_hypothesis(player, label))
            for player in chunk_players
            for text in player_texts[player]
            for label in CANDIDATE_LABELS
        ]

        raw_scores = model.predict(chunk_pairs, batch_size=BATCH_SIZE)
        entailment_scores = raw_scores[:, ENTAILMENT_COL].reshape(-1, NUM_LABELS)

        row_cursor = 0
        for player in chunk_players:
            texts = player_texts[player]
            n = len(texts)
            player_entailment = entailment_scores[row_cursor:row_cursor + n]
            row_cursor += n

            player_result = _aggregate_player_result(final_player_object, player, texts, player_entailment)

            completed += 1
            print(f'Analyzed {player} as {player_result["sentiment_consensus"]} ({completed}/{total})...')
            yield player, player_result, completed, total
