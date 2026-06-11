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

def _make_hypothesis(player, label):
    if label == "positive":
        return f"{player} will perform at a high level or positively influence fantasy points."
    elif label == "negative":
        return f"{player} will perform at a low level or negatively impact fantasy points."
    else:
        return f"{player} will perform as average or neutrally impact fantasy points."

def analyze_sentiment(final_player_object: dict, raw_sentences: list[str]):
    """
    Iteratively yields (player_name, player_result, current_index, total) for each player so
    callers can emit SSE heartbeats between players and prevent proxy timeouts.
    Each player is inferred independently; total pairs per player is at most
    MAX_SENTENCES_PER_PLAYER * len(CANDIDATE_LABELS) = 30, so under BATCH_SIZE.
    """
    sorted_players = sorted(
        final_player_object.keys(),
        key=lambda p: len(final_player_object[p]['mentioned_sentence_indexes']),
        reverse=True
    )[:MAX_PLAYERS]

    total = len(sorted_players)
    entailment_col = model.config.label2id['entailment']
    num_labels = len(CANDIDATE_LABELS)

    for i, player in enumerate(sorted_players):
        # build context windows
        indexes = list(final_player_object[player]['mentioned_sentence_indexes'])[:MAX_SENTENCES_PER_PLAYER]
        texts = [
            context_window.get_context_window(idx, raw_sentences, window_size=2)
            for idx in indexes
        ]

        if not texts:
            continue

        pairs = [
            (text, _make_hypothesis(player, label))
            for text in texts
            for label in CANDIDATE_LABELS
        ]

        scores = model.predict(pairs, batch_size=BATCH_SIZE)

        results = []
        for j in range(len(texts)):
            pair_start = j * num_labels
            # isolate the score for each sentence
            scores_slice = scores[pair_start:pair_start + num_labels]
            entailment_scores = scores_slice[:, entailment_col]
            # get best label
            best_idx = int(np.argmax(entailment_scores))
            results.append({
                "text": texts[j],
                "scores": {label: float(score) for label, score in zip(CANDIDATE_LABELS, entailment_scores)},
                "best_label": CANDIDATE_LABELS[best_idx]
            })

        scores_matrix = np.array([list(r["scores"].values()) for r in results])
        average_scores = np.mean(scores_matrix, axis=0)
        label_array = [CANDIDATE_LABELS[int(np.argmax(s))] for s in scores_matrix]

        player_result = {
            "sentiment_consensus": {label: float(score) for label, score in zip(CANDIDATE_LABELS, average_scores)},
            "average_label": CANDIDATE_LABELS[int(np.argmax(average_scores))],
            "most_frequent_label": statistics.mode(label_array),
            "detailed_sentiment": results,
            "status": final_player_object[player]['occurrence_array'][0]['status'],
            "transcript_name": final_player_object[player]['occurrence_array'][0]['transcript_name'],
            "player_id": final_player_object[player]['occurrence_array'][0]['player_id'],
            "player_team": final_player_object[player]['occurrence_array'][0]['player_team'],
        }

        print(f'Analyzed {player} as {player_result["sentiment_consensus"]} ({i + 1}/{total})...')
        yield player, player_result, i + 1, total
