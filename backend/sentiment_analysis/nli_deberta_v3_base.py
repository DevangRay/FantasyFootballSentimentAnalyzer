from sentence_transformers import CrossEncoder
import numpy as np
import statistics
import utils.context_window as context_window

# nli-deberta-v3-small: ~180MB vs ~700MB for base — fits within Railway's 2GB limit
model = CrossEncoder('cross-encoder/nli-deberta-v3-small')

CANDIDATE_LABELS = ["positive", "negative", "neutral"]
MAX_PLAYERS = 50
MAX_SENTENCES_PER_PLAYER = 5
BATCH_SIZE = 16

def _make_hypothesis(player, label):
    if label == "positive":
        return f"{player} will perform at a high level or positively influence fantasy points."
    elif label == "negative":
        return f"{player} will perform at a low level or negatively impact fantasy points."
    else:
        return f"{player} will perform as average or neutrally impact fantasy points."

def analyze_sentiment(final_player_object: dict, raw_sentences: list[str]):
    # Cap at MAX_PLAYERS sorted by mention count to bound memory and time
    sorted_players = sorted(
        final_player_object.keys(),
        key=lambda p: len(final_player_object[p]['mentioned_sentence_indexes']),
        reverse=True
    )[:MAX_PLAYERS]

    # Build context windows per player, capped per player
    player_texts = {}
    for player in sorted_players:
        indexes = final_player_object[player]['mentioned_sentence_indexes'][:MAX_SENTENCES_PER_PLAYER]
        player_texts[player] = [
            context_window.get_context_window(idx, raw_sentences, window_size=2)
            for idx in indexes
        ]

    # Flatten all (text, hypothesis) pairs into one list, track per-player offsets
    all_pairs = []
    player_offsets = {}
    for player in sorted_players:
        start = len(all_pairs)
        for text in player_texts[player]:
            for label in CANDIDATE_LABELS:
                all_pairs.append((text, _make_hypothesis(player, label)))
        player_offsets[player] = (start, len(player_texts[player]))

    if not all_pairs:
        return {}

    # Single batched inference call instead of one call per text snippet
    all_scores = model.predict(all_pairs, batch_size=BATCH_SIZE)
    entailment_col = model.config.label2id['entailment']

    sentiment_object = {}
    num_labels = len(CANDIDATE_LABELS)

    for player in sorted_players:
        start, text_count = player_offsets[player]
        results = []

        for i in range(text_count):
            pair_start = start + i * num_labels
            scores_slice = all_scores[pair_start:pair_start + num_labels]
            entailment_scores = scores_slice[:, entailment_col]
            best_idx = int(np.argmax(entailment_scores))
            results.append({
                "text": player_texts[player][i],
                "scores": {label: float(score) for label, score in zip(CANDIDATE_LABELS, entailment_scores)},
                "best_label": CANDIDATE_LABELS[best_idx]
            })

        scores_matrix = np.array([list(r["scores"].values()) for r in results])
        average_scores = np.mean(scores_matrix, axis=0)
        label_array = [CANDIDATE_LABELS[int(np.argmax(s))] for s in scores_matrix]

        sentiment_object[player] = {
            "sentiment_consensus": {label: float(score) for label, score in zip(CANDIDATE_LABELS, average_scores)},
            "average_label": CANDIDATE_LABELS[int(np.argmax(average_scores))],
            "most_frequent_label": statistics.mode(label_array),
            "detailed_sentiment": results,
            "status": final_player_object[player]['occurrence_array'][0]['status'],
            "transcript_name": final_player_object[player]['occurrence_array'][0]['transcript_name'],
            "player_id": final_player_object[player]['occurrence_array'][0]['player_id'],
            "player_team": final_player_object[player]['occurrence_array'][0]['player_team'],
        }

    return sentiment_object
