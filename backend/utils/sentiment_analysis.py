from transformers import pipeline
import utils.context_window as context_window

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def analyze_sentiment(final_player_object: dict, raw_sentences: list[str]):
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
        # result = classifier(player_text, candidate_labels)
            
        print(f"Player: {player}")
        print(player_text)