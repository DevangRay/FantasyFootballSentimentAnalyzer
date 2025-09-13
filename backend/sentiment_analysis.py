import spacy
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
import re
import json

import nfl as nfl

nlp = spacy.load("en_core_web_trf")
sentencizer = nlp.add_pipe("sentencizer")

def name_is_valid(name: str) -> bool:
    unwanted_names = [
        "rich dodson", "rich", "dodson"
        "matt o'hara", "matt", "o'hara",
        "g price", "g", "price",
        "garrett"
    ]
    
    return not name.lower() in unwanted_names

def clean_name_and_sentence_of_nicknames(name: str, sentence: str) -> str:
    nickname_mappings = {
        "joker": "Evan Engram",
        "cmc": "Christian McCaffrey"
    }
    
    if name.lower() in nickname_mappings:
        sentence = re.sub(name.lower(), nickname_mappings[name.lower()], sentence, flags=re.IGNORECASE)
        name = nickname_mappings[name.lower()]
        
        
    return name, sentence

def process_transcript(transcript_filepath: str) -> list[str]:
    # read transcript file to variable raw_transcript
    raw_transcript = open(transcript_filepath, "r").read()
    
    # use spacy to split raw_transcript into sentences and identify named entities
    doc = nlp(raw_transcript)
    sentences = list(doc.sents)

    # create list of stringified sentences and write to sentences.json    
    stringified_sentences = [sent.text.strip() for sent in sentences]
    with open("../resources/sentences.json", "w", encoding="utf-8") as f:
        json.dump(stringified_sentences, f, ensure_ascii=False, indent=2)
    
    # create list of identified names, associated with the sentence index and the sentence itself
    identified_names = []
    for i, sent in enumerate(sentences, start=0):
        names = [ent.text for ent in sent.ents if ent.label_ == "PERSON"]
        for name in names:
            if name_is_valid(name):
                clean_name, clean_sentence = clean_name_and_sentence_of_nicknames(name, sent.text.strip())
                identified_names.append({
                    "name": clean_name,
                    "sentence_index": i,
                    "sentence": clean_sentence
                })
    
    # for identified_name in identified_names:
    #     print(f"{identified_name['name']} | {identified_name['sentence_index']} | {identified_name['sentence']}")
    
    # save list of real NFL players to nfl_player_roster
    # nfl.get_nfl_players()
    nfl_player_roster = []
    with open("../resources/nfl_roster.json", "r") as f:
        nfl_player_roster = json.load(f)

    # fuzzy match identified names to nfl_player_roster, and save in final_player_object
    final_player_object = []
    for index, player_object in enumerate(identified_names, start=0):
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
        
        final_player_object.append({
            "transcript_name": player,
            "matched_name": final_name,
            "score": possible_matches[0][1] if len(possible_matches) > 0 else 0,
            "status": status,
            "sentence_index": player_object['sentence_index'],
            "sentence": player_object['sentence']
        })
    
    sorted_final_player_object = sorted(final_player_object, key=lambda x: x['matched_name'].lower()) 
    print(sorted_final_player_object)
    

def main():
    sentences = process_transcript("../resources/transcript.txt")
    print(sentences)

if __name__ == "__main__":
    main()