import spacy
from fuzzywuzzy import fuzz
from fuzzywuzzy import process

import json

import utils.name_cleaning as name_cleaning
import utils.nfl as nfl
import sentiment_analysis as sa

nlp = spacy.load("en_core_web_trf")
sentencizer = nlp.add_pipe("sentencizer")
    
def process_transcript(transcript_filepath: str) -> list[str]:
    # read transcript file to variable raw_transcript
    raw_transcript = open(transcript_filepath, "r").read()
    
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
            if name_cleaning.name_is_valid(name):
                clean_name = name_cleaning.replace_nickname_in_name(name)
                clean_sentence = name_cleaning.replace_nickname_in_sentence(sent.text.strip())
                identified_names.append({
                    "name": clean_name,
                    "sentence_index": i,
                    "sentence": clean_sentence
                })
    # for identified_name in identified_names:
    #     print(f"{identified_name['name']} | {identified_name['sentence_index']} | {identified_name['sentence']}")
    return identified_names, raw_sentences
    
    
def match_players_to_roster(identified_names: list[dict]):
    # save list of real NFL players to nfl_player_roster
    # nfl.get_nfl_players()
    nfl_player_roster = []
    with open("../resources/nfl_roster.json", "r") as f:
        nfl_player_roster = json.load(f)

    # fuzzy match identified names to nfl_player_roster, and save in final_player_object
    final_player_object = {}
    for player_object in identified_names:
        player = player_object['name']
        closest_player_list = process.extract(player, nfl_player_roster, limit=5, scorer=fuzz.token_set_ratio)
                
        possible_matches = [close_player for close_player in closest_player_list if close_player[1] == 100]
        if len(possible_matches) < 1: 
            possible_matches = [close_player for close_player in closest_player_list if close_player[1] > 80]
       
        final_name = ""
        status = ""
        if (len(possible_matches) == 1): 
            # perfect match
            final_name = possible_matches[0][0]
            status = "perfect match"
        elif (len(possible_matches) > 1):
            # multiple matches
            # final_name = " | ".join(possible_matches)
            final_name = possible_matches[0][0]
            status = "best of multiple matches"
        else:
            # no matches
            final_name = player
            status = "no match"

        if final_name in final_player_object:
            final_player_object[final_name]['occurrence_array'].append({
                "transcript_name": player,
                "matched_name": final_name,
                "score": possible_matches[0][1] if len(possible_matches) > 0 else 0,
                "status": status,
                "sentence_index": player_object['sentence_index'],
                "sentence": player_object['sentence']
            })
            final_player_object[final_name]['mentioned_sentence_indexes'].add(player_object['sentence_index'])
        else:
            final_player_object[final_name] = {
                'occurrence_array': [{
                    "transcript_name": player,
                    "matched_name": final_name,
                    "score": possible_matches[0][1] if len(possible_matches) > 0 else 0,
                    "status": status,
                    "sentence_index": player_object['sentence_index'],
                    "sentence": player_object['sentence']
                }],
                'mentioned_sentence_indexes': set([player_object['sentence_index']])
            }
    
    # sorted_final_player_object = sorted(final_player_object, key=lambda x: x['matched_name'].lower()) 
    # sorted_final_player_object = dict(sorted(final_player_object.items()))
    # print(sorted_final_player_object)    
    return final_player_object



def main():
    identified_names, raw_sentences = process_transcript("../resources/transcript.txt")
    final_player_object = match_players_to_roster(identified_names)
    sa.analyze_sentiment(final_player_object, raw_sentences)

if __name__ == "__main__":
    main()