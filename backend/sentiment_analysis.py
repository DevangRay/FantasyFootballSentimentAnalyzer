import spacy
from fuzzywuzzy import fuzz
from fuzzywuzzy import process
import nfl as nfl
import json

nlp = spacy.load("en_core_web_trf")
sentencizer = nlp.add_pipe("sentencizer")

def name_is_clean(name: str) -> bool:
    unwanted_names = [
        "rich dodson", "rich", "dodson"
        "matt o'hara", "matt", "o'hara",
        "g price", "g", "price",
        "garrett"
    ]
    
    return not name.lower() in unwanted_names

def process_transcript(transcript_filepath: str) -> list[str]:
    raw_transcript = open(transcript_filepath, "r").read()
    
    doc = nlp(raw_transcript)
    sentences = list(doc.sents)
    stringified_sentences = [sent.text.strip() for sent in sentences]
    with open("../resources/sentences.json", "w", encoding="utf-8") as f:
            json.dump(stringified_sentences, f, ensure_ascii=False, indent=2)
    
    identified_names = []
    for i, sent in enumerate(sentences, start=0):
        names = [ent.text for ent in sent.ents if ent.label_ == "PERSON"]
        for name in names:
            if name_is_clean(name):
                identified_names.append({
                    "name": name,
                    "sentence_index": i,
                    "sentence": sent.text.strip()
                })
    
    for identified_name in identified_names:
        print(f"{identified_name['name']} | {identified_name['sentence_index']} | {identified_name['sentence']}")
    
    # # nfl.get_nfl_players()
    nfl_player_roster = []
    with open("../resources/nfl_roster.json", "r") as f:
        nfl_player_roster = json.load(f)
    # print(len(nfl_player_roster)) # --> 6172
    
    for player_object in identified_names:
        player = player_object['name']
        closest_player_list = process.extract(player, nfl_player_roster, limit=5, scorer=fuzz.token_set_ratio)
        
        possible_matches = [close_player[0] for close_player in closest_player_list if close_player[1] == 100]
        if len(possible_matches) < 1: 
            possible_matches = [close_player[0] for close_player in closest_player_list if close_player[1] > 80]
        
        final_name = ""
        if (len(possible_matches) > 0):
            final_name = " | ".join(possible_matches) + f" ({player})"
        else:
            final_name = f"NO MATCH => {player}"
            
        print(f" {final_name} | {player_object['sentence_index']} | {player_object['sentence']}")
    

def main():
    sentences = process_transcript("../resources/transcript.txt")
    print(sentences)

if __name__ == "__main__":
    main()