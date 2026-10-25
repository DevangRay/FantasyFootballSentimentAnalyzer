nickname_mappings = {
        "joker": "Evan Engram",
        "evan ingram": "Evan Engram",
        "enjoku": "David Njoku",
        "david and joku": "David Njoku",
        "david and david njoku": "David Njoku",
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
        "leaporta": "Sam LaPorta",
        "leapora": "Sam LaPorta",
        "sam laora": "Sam LaPorta",
        "sam lapoora": "Sam LaPorta",
        "sam laapora": "Sam LaPorta",
        "sam leaport": "Sam LaPorta",
        "sam laaporta": "Sam LaPorta",
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
        "bjan robinson": "Bijan Robinson",
        "bejian robinson": "Bijan Robinson",
        "warren": "Tyler Warren",
        "tua": "Tua Tagovailoa",
        "loveland": "Colston Loveland",
        "kyle pitts": "Kyle Pitts Sr.",
        "harold fannin": "Harold Fannin Jr.",
        "harold fannon": "Harold Fannin Jr.",
        "michael pitman": "Michael Pittman",
        "ted hurst": "Ted Hurst III",
        "marv": "Marvin Harrison Jr.",
        "mendoza": "Fernando Mendoza",
        "brian dable": "Brian Daboll",
        "tyler lindendomb": "Tyler Linderbaum",
        "pennix": "Michael Penix Jr.",
        "tess johnson": "Tez Johnson",
        "waddles": "Jaylen Waddle",
        "brock purie": "Brock Purdy",
        "jackson dart": "Jaxon Dart",
        "tyler shuck": "Tyler Shough",
        "bone knicks": "Bo Nix",
        "jordan tyson": "Jordyn Tyson",
        "bjan robinson's": "Bijan Robinson"
    }

"""
>> Um whenever AJ Brown or Dvonte Smith has missed time, he's been a huge beneficiary on the offense. AJ Brown is gone. >> He's going to miss some time for the >> Kai Lemon has had two hamstring injuries
Bowowers 
Jir Gibbs, Alman Ron St. Brown,
Sutton 
Clint Kubak he was Lafle might be a good you know they're both offensive minded head coaches but Kubak Jacobe Brc 
Lovelin
Dallas Goddard
Brock Pury
Fannon 
Ninjoku 
Kyle Pitts
Naylor 
"""


import re

def name_is_valid(name: str) -> bool:
    unwanted_names = [
        "rich dodson", "rich", "dodson", "dotson",
        "matt o'hara", "matt", "o'hara", "Matt O'Hara", 
        "g price", "g", "price",
        "garrett", 
        "god", 
        "taylor swift",
        "nerd herd", "nerd30",
        "matt miller", "chalky chalk", 
        "jason", "andy", "mike", "jason moore", "andy holloway", "mike wright"
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