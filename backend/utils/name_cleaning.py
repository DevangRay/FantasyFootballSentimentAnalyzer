nickname_mappings = {
        "joker": "Evan Engram",
        "evan ingram": "Evan Engram",
        "enjoku": "David Njoku",
        "injoku": "David Njoku",
        "andoku": "David Njoku",
        "jook": "David Njoku",
        "jooku": "David Njoku",
        "jookus": "David Njoku",
        "craft": "Tucker Kraft",
        "doug craft": "Tucker Kraft",
        "tuckercraft": "Tucker Kraft",
        "daltton concaid": "Dalton Kincaid",
        "dolan concade": "Dalton Kincaid",
        "dinc concaid": "Dalton Kincaid",
        "dan concade": "Dalton Kincaid",
        "brock bowowers": "Brock Bowers",
        "brock b": "Brock Bowers",
        "brock bower": "Brock Bowers",
        "bower's": "Brock Bowers",
        "george kd": "George Kittle",
        "kd": "George Kittle",
        "hawinson": "T.J. Hockenson",
        "hinson": "T.J. Hockenson",
        "hockson": "T.J. Hockenson",
        "t.j hawinson": "T.J. Hockenson",
        "t.j. hawinson": "T.J. Hockenson",
        "tj hawinson": "T.J. Hockenson",
        "hot tockinson": "T.J. Hockenson",
        "kelsey": "Travis Kelce",
        "kyle pittz": "Kyle Pitts",
        "leaporta": "Sam LePorta",
        "leapora": "Sam LePorta",
        "sam laora": "Sam LePorta",
        "sam lapoora": "Sam LePorta",
        "sam laapora": "Sam LePorta",
        "sam leaport": "Sam LePorta",
        "sam laaporta": "Sam LePorta",
        "trey mc bry": "Trey McBride",
        "mcbride": "Trey McBride",
        "tyler war": "Tyler Warren",
        "zach z": "Zach Ertz",
        "zack z": "Zach Ertz",
        "zacks": "Zach Ertz",
        "coleston love": "Colston Loveland",
        "sonat": "Ben Sinnott",
        "flaco": "Joe Flacco",
        "dylan gabriel": "Dillon Gabriel",
        "judy": "Jerry Jeudy",
        "josh ds": "Josh Downs",
        "cmc": "Christian McCaffrey",
        "rasheed rice": "Rashee Rice",
        "rashid rice": "Rashee Rice",
        "bejan": "Bijan Robinson",
        
    }

import re

def name_is_valid(name: str) -> bool:
    unwanted_names = [
        "rich dodson", "rich", "dodson"
        "matt o'hara", "matt", "o'hara",
        "g price", "g", "price",
        "garrett", 
        "god", 
        "taylor swift",
        "nerd herd",
        "matt miller"
    ]
    
    return not name.lower() in unwanted_names

def replace_nickname_in_sentence(sentence: str) -> str:
    def replacer(match):
        word = match.group(0)
        replacement = nickname_mappings.get(word.lower())
        return replacement
    
    pattern = r"\b(" + "|".join(map(re.escape, nickname_mappings.keys())) + r")\b"
    return re.sub(pattern, replacer, sentence, flags=re.IGNORECASE)

def replace_nickname_in_name(name: str) -> str:
    if name.lower() in nickname_mappings:
        return nickname_mappings[name.lower()]
        
    return name    