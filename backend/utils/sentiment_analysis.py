from transformers import pipeline
import numpy as np
import utils.context_window as context_window

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def aggregate_results(results: list[dict]) -> dict: 
    scores = {label: [] for label in results[0]['labels']}
    
    for result in results:
        for label, score in zip(result['labels'], result['scores']):
            scores[label].append(score)
    
    return {label: np.mean(aggregated_scores) for label, aggregated_scores in scores.items()}

def analyze_sentiment(final_player_object: dict, raw_sentences: list[str]):
    sentiment_object = {}
    for player in final_player_object:
        """
            text = [...]
            candidate_labels = ["praise", "criticism", "neutral"]

            result = classifier(text, candidate_labels)
            print(result)
        """
        player_text = []
        for sentence_index in final_player_object[player]['mentioned_sentence_indexes']:
            sentence_with_context = context_window.get_context_window(sentence_index, raw_sentences, window_size=2)
            player_text.append(sentence_with_context)
            
        candidate_labels = ["praise", "criticism", "neutral"]
        result = classifier(player_text, candidate_labels)
        
        sentiment_consensus = aggregate_results(result)
        sentiment_object[player] = {
            "sentiment_consensus": sentiment_consensus,
            "detailed_sentiment": result,
            # "occurrences": final_player_object[player]['occurrence_array']
        }
    
    return sentiment_object