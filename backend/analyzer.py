import spacy
from fuzzywuzzy import fuzz
from fuzzywuzzy import process

import json

# import utils.transcript as transcript
import utils.name_cleaning as name_cleaning
import utils.nfl as nfl
# import sentiment_analysis.bart_large_mnli as bart
import sentiment_analysis.nli_deberta_v3_base as nli

nlp = spacy.load("en_core_web_trf")
sentencizer = nlp.add_pipe("sentencizer")
    
def process_transcript(podcast_transcript_filepath=None, podcast_transcript_text=None )-> tuple[list[dict], list[str]]:
    # read transcript file to variable raw_transcript
    raw_transcript = ""
    if (podcast_transcript_filepath):
        print("reading transcript from file")
        raw_transcript = open(podcast_transcript_filepath, "r", encoding="utf-8").read()
    elif podcast_transcript_text:
        print("reading transcript from text input")
        raw_transcript = podcast_transcript_text
    else: 
        return ValueError("Either podcast_transcript_filepath or podcast_transcript_text must be provided.")
    
    # use spacy to split raw_transcript into sentences and identify named entities
    doc = nlp(raw_transcript)
    raw_sentences = list(doc.sents)

    # # create list of stringified sentences and write to sentences.json    
    # stringified_sentences = [sent.text.strip() for sent in raw_sentences]
    # with open("../resources/sentences.json", "w", encoding="utf-8") as f:
    #     json.dump(stringified_sentences, f, ensure_ascii=False, indent=2)
    
    # create list of identified names, associated with the sentence index and the sentence itself
    identified_names = []
    for i, sent in enumerate(raw_sentences, start=0):
        names = [ent.text for ent in sent.ents if ent.label_ == "PERSON"]
        for name in names:
            # Remove leading articles from the name (e.g., "a Jackson Dart" -> "Jackson Dart")
            cleaned_name = name.strip()
            for article in ["a ", "an ", "the "]:
                if cleaned_name.lower().startswith(article):
                    cleaned_name = cleaned_name[len(article):]
            if name_cleaning.name_is_valid(cleaned_name):
                clean_name = name_cleaning.replace_nickname_in_name(cleaned_name)
                clean_sentence = name_cleaning.replace_nickname_in_sentence(sent.text.strip())
                identified_names.append({
                    "name": clean_name,
                    "sentence_index": i,
                    "sentence": clean_sentence
                })
    # for identified_name in identified_names:
    #     print(f"{identified_name['name']} | {identified_name['sentence_index']} | {identified_name['sentence']}")
    return identified_names, raw_sentences
    
    
def match_players_to_roster(identified_names: list[dict]) -> dict:
    # save list of real NFL players to nfl_player_roster
    # nfl.get_nfl_players()
    nfl_player_roster = {}
    with open("../resources/nfl_roster.json", "r") as f:
        nfl_player_roster = json.load(f)
        
    # nfl_player_names = [player['name'] for player in nfl_player_roster]
    nfl_player_names = nfl_player_roster.keys()

    # fuzzy match identified names to nfl_player_roster, and save in final_player_object
    final_player_object = {}
    for player_object in identified_names:
        player = player_object['name']
        closest_player_list = process.extract(player, nfl_player_names, limit=5, scorer=fuzz.token_set_ratio)
                
        possible_matches = [close_player for close_player in closest_player_list if close_player[1] == 100]
        if len(possible_matches) < 1: 
            possible_matches = [close_player for close_player in closest_player_list if close_player[1] > 80]
       
        final_name = ""
        status = ""
        if (len(possible_matches) == 0):
            # no matches
            final_name = player
            status = "no match"
        else:
            # perfect match or multiple matches
            final_name = possible_matches[0][0]
            # replace name in sentence with final_name
            original_sentence = player_object['sentence']
            player_object['sentence'] = player_object['sentence'].replace(player, final_name)
            
            status = "perfect match" if len(possible_matches) == 1 else "best of multiple matches"
            
            if final_name in final_player_object:
                final_player_object[final_name]['occurrence_array'].append({
                    "transcript_name": player,
                    "player_id": nfl_player_roster[final_name]['id'],
                    "matched_name": final_name,
                    "score": possible_matches[0][1] if len(possible_matches) > 0 else 0,
                    "status": status,
                    "sentence_index": player_object['sentence_index'],
                    "sentence": player_object['sentence'],
                    "original sentence": original_sentence
                })
                final_player_object[final_name]['mentioned_sentence_indexes'].add(player_object['sentence_index'])
            else:
                final_player_object[final_name] = {
                    'occurrence_array': [{
                        "transcript_name": player,
                        "player_id": nfl_player_roster[final_name]['id'],
                        "matched_name": final_name,
                        "score": possible_matches[0][1] if len(possible_matches) > 0 else 0,
                        "status": status,
                        "sentence_index": player_object['sentence_index'],
                        "sentence": player_object['sentence'],
                        "original sentence": original_sentence
                    }],
                    'mentioned_sentence_indexes': set([player_object['sentence_index']])
                }
    
    # sorted_final_player_object = sorted(final_player_object, key=lambda x: x['matched_name'].lower()) 
    # sorted_final_player_object = dict(sorted(final_player_object.items()))
    # print(sorted_final_player_object)    
    return final_player_object

def example_analysis() -> dict:
    transcipt_file_path = "../resources/transcript.txt"
    identified_names, raw_sentences = process_transcript(podcast_transcript_filepath=transcipt_file_path)
    print("Total Identified Names:", len(identified_names))
    
    final_player_object = match_players_to_roster(identified_names)
    print("Total Unique Players Mentioned:", len(final_player_object))
    print(final_player_object)
    
    player_sentiments = nli.analyze_sentiment(final_player_object, raw_sentences)
    print("Total Players with Sentiment Analysis:", len(player_sentiments))
        
    return player_sentiments

def set_up_to_analyze(transcript: str) -> dict:
    identified_names, raw_sentences = process_transcript(podcast_transcript_text=transcript)
    print("Total Identified Names:", len(identified_names))
    
    final_player_object = match_players_to_roster(identified_names)
    print("Total Unique Players Mentioned:", len(final_player_object))
    print(final_player_object)
    
    # Convert sets to lists for JSON serialization
    for player in final_player_object.values():
        if isinstance(player.get('mentioned_sentence_indexes'), set):
            player['mentioned_sentence_indexes'] = list(player['mentioned_sentence_indexes'])
    
    return {
        "final_player_object": final_player_object,
        "stripped_sentences": [sent.text.strip() for sent in raw_sentences]
    }

def analyze(transcript: str) -> dict:
    identified_names, raw_sentences = process_transcript(podcast_transcript_text=transcript)
    print("Total Identified Names:", len(identified_names))
    
    final_player_object = match_players_to_roster(identified_names)
    print("Total Unique Players Mentioned:", len(final_player_object))
    print(final_player_object)
    
    player_sentiments = nli.analyze_sentiment(final_player_object, raw_sentences)
    print("Total Players with Sentiment Analysis:", len(player_sentiments))
        
    return player_sentiments


def main():
    # # Transcript section
    # podcastAudioFileName = "rookie_te_breakout_incoming!_top_12_tes_for_fantasy_football_2025.wav"
    # print("getting transcript with faster-whisper...")
    # # transcription_results = transcript.getTranscriptFromAudio(f"../resources/{podcastAudioFileName}")
    # # clean_transcription_results = transcription_results["text"].strip('"').strip()
    # transcription_results = transcript.getFasterTranscriptFromAudio(f"../resources/{podcastAudioFileName}")
    # print(transcription_results)
    
    # TODO: sentiment analysis section
        # what happens if reviews are 1 positive and 1 negative?
        # should be waited based on extremeness of average (100% positive, 50% negative => positive)

        # if only first_name found, and first_name is among previously identified fullel_names, replace first_name with full_name in sentence
    transcipt_file_path = "../resources/transcript.txt"
    identified_names, raw_sentences = process_transcript(transcipt_file_path)
    print("Total Identified Names:", len(identified_names))
    with open("../outputs/identified_names/nli_identified_names.json", "w", encoding="utf-8") as f:
        json.dump(identified_names, f, ensure_ascii=False, indent=2)
    
    final_player_object = match_players_to_roster(identified_names)
    print("Total Unique Players Mentioned:", len(final_player_object))
    print(final_player_object)
    
    player_sentiments = nli.analyze_sentiment(final_player_object, raw_sentences)
    print("Total Players with Sentiment Analysis:", len(player_sentiments))
    
    with open("../outputs/only_matches/nli/player_sentiments.json", "w", encoding="utf-8") as f:
        json.dump(player_sentiments, f, ensure_ascii=False, indent=2)
        
# if __name__ == "__main__":
#     main()