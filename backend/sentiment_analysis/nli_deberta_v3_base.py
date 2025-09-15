from sentence_transformers import CrossEncoder
import numpy as np
import utils.context_window as context_window

model = CrossEncoder('cross-encoder/nli-deberta-v3-base')

def analyze_sentiment(final_player_object: dict, raw_sentences: list[str]):
    sentiment_object = {}
    
    for player in final_player_object:
        player_text = []
        for sentence_index in final_player_object[player]['mentioned_sentence_indexes']:
            sentence_with_context = context_window.get_context_window(sentence_index, raw_sentences, window_size=2)
            player_text.append(sentence_with_context)
        
    
        candidate_labels = ["positive", "negative", "neutral"]
        
        def make_hypotheses(player, label):
            if label == "positive":
                return f"{player} will perform at a high level and positively influence fantasy points."
            elif label == "negative":
                return f"{player} will underperform or negatively impact fantasy points."
            else:
                return f"{player} will have an average or neutral impact."

        results = []
        for text in player_text:
            pairs = [(text, make_hypotheses(player, label)) for label in candidate_labels]
            scores = model.predict(pairs)
            
            entailment_col_index = model.config.label2id['entailment']
            entailment_scores = scores[:, entailment_col_index]
            best_idx = int(np.argmax(entailment_scores))
            results.append({
                "text": text,
                # "scores": dict(zip(candidate_labels, entailment_scores)),
                "scores": {label: float(score) for label, score in zip(candidate_labels, entailment_scores)},
                "best_label": candidate_labels[best_idx]
            })
        
        scores_matrix = np.array([list(result["scores"].values()) for result in results])
        average_scores = np.mean(scores_matrix, axis=0)
        final_label = candidate_labels[np.argmax(average_scores)]
        
        average_scores_dict = {label: float(score) for label, score in zip(candidate_labels, average_scores)}
        sentiment_object[player] = {
            "sentiment_consensus": average_scores_dict,
            "final_label": final_label,
            "detailed_sentiment": results,
            "status": final_player_object[player]['occurrence_array'][0]['status'],
            "transcript_name": final_player_object[player]['occurrence_array'][0]['transcript_name']
        }
    
    return sentiment_object