from sentence_transformers import CrossEncoder
import numpy as np
import statistics
import utils.context_window as context_window

model = CrossEncoder('cross-encoder/nli-deberta-v3-base')
CANDIDATE_LABELS = ["positive", "negative", "neutral"]
ENTAILMENT_COL_INDEX = model.config.label2id['entailment']
    
def analyze_sentiment(final_player_object: dict, raw_sentences: list[str]):
    print("[nli_deberta_v3_base | analyze_sentiment] Entering 'analyze_sentiment' with final_player_object of length:", len(final_player_object))
    # build object to pass to model
    all_player_sentence_pairs = [] # big array holding every player/sentence/label combination to be passed in one model call
    player_to_context_map = {} # [player name] -> list of context-window strings
    for player in final_player_object:
        player_context = []
        for sentence_index in final_player_object[player]['mentioned_sentence_indexes']:
            sentence_with_context = context_window.get_context_window(sentence_index, raw_sentences, window_size=2)
            player_context.append(sentence_with_context)
        
        player_to_context_map[player] = player_context

        for context in player_context:
            for label in CANDIDATE_LABELS:
                all_player_sentence_pairs.append((context, make_hypotheses(player, label)))
    print("[nli_deberta_v3_base | analyze_sentiment] Flattened players into an array of length:", len(all_player_sentence_pairs))
              
    # guard against empty input
    if not all_player_sentence_pairs:
        print("[nli_deberta_v3_base | analyze_sentiment] No player-sentence pairs to analyze.")
        return {}
    
    # shape is (len(all_player_sentence_pairs), 3) where 3 is the number of candidate labels
    # test 16/32/64
    print("[nli_deberta_v3_base | analyze_sentiment] Predicting scores for", len(all_player_sentence_pairs), "player-sentence pairs.")
    raw_scores = model.predict(all_player_sentence_pairs, batch_size=32)
    print("[nli_deberta_v3_base | analyze_sentiment] Predicted raw scores of shape:", raw_scores.shape)
    
    # get (len(all_player_sentence_pairs), 1) vectore of only entailemt scores (removing contradiction/neutral)
    entailment_scores = raw_scores[:, ENTAILMENT_COL_INDEX]
    print("[nli_deberta_v3_base | analyze_sentiment] Entailment scores of shape:", entailment_scores.shape)
    # reshape to (len(all_player_sentence_pairs), len(CANDIDATE_LABELS)), where each row corresponds to a sentence and each column corresponds to a candidate label
    entailment_scores = entailment_scores.reshape(-1, len(CANDIDATE_LABELS))
    print("[nli_deberta_v3_base | analyze_sentiment] Reshaped entailment scores of shape:", entailment_scores.shape)
    
    sentiment_object = {}
    cursor = 0
    for player in final_player_object:
        results = []
        for context in player_to_context_map[player]:
            scores_for_sentence = entailment_scores[cursor]
            cursor += 1
            best_idx = int(np.argmax(scores_for_sentence))
            results.append({
                "text": context,
                "scores": {label: float(score) for label, score in zip(CANDIDATE_LABELS, scores_for_sentence)},
                "best_label": CANDIDATE_LABELS[best_idx]
            })
        
        scores_matrix = np.array([list(result["scores"].values()) for result in results])
        average_scores = np.mean(scores_matrix, axis=0)
        
        label_array = [CANDIDATE_LABELS[int(np.argmax(score_set))] for score_set in scores_matrix]
            
        most_frequent_label = statistics.mode(label_array)
        
        average_label = CANDIDATE_LABELS[np.argmax(average_scores)]
        
        average_scores_dict = {label: float(score) for label, score in zip(CANDIDATE_LABELS, average_scores)}
        print("[nli_deberta_v3_base | analyze_sentiment] Average scores for player", player, "are:", average_scores_dict)
        print("[nli_deberta_v3_base | analyze_sentiment] Average label for player", player, "is:", average_label)
        print("[nli_deberta_v3_base | analyze_sentiment] Most frequent label for player", player, "is:", most_frequent_label)
        sentiment_object[player] = {
            "sentiment_consensus": average_scores_dict,
            "average_label": average_label,
            "most_frequent_label": most_frequent_label,
            "detailed_sentiment": results,
            "status": final_player_object[player]['occurrence_array'][0]['status'],
            "transcript_name": final_player_object[player]['occurrence_array'][0]['transcript_name'],
            "player_id": final_player_object[player]['occurrence_array'][0]['player_id'],
            "player_team": final_player_object[player]['occurrence_array'][0]['player_team'],
        }
    
    return sentiment_object

def make_hypotheses(player, label):
    if label == "positive":
        return f"{player} will perform at a high level or positively influence fantasy points."
    elif label == "negative":
        return f"{player} will perform at a low level or negatively impact fantasy points."
    else:
        return f"{player} will perform as average or neutrally impact fantasy points."
    """
        if label == "positive":
            return f"{player} will perform at a high level and positively influence fantasy points."
        elif label == "negative":
            return f"{player} will underperform or negatively impact fantasy points."
        else:
            return f"{player} will have an average or neutral impact."
    """