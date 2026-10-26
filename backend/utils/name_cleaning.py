"""Name validation, plus the residue of aliases that no derived rule can reach.

Most spoken and mis-transcribed names are now resolved by rules built from the roster
itself (see player_resolver.py), so this file no longer carries a per-podcast lookup
table. What is left are nicknames with no phonetic or structural relationship to the
player's real name, which are irreducibly a matter of knowing the show.
"""

import functools
import re

# Aliases the derived rules get wrong or miss, verified against the development
# transcripts by tests/test_player_resolver.py. Each one is here because it is either a
# true nickname (no sound or spelling in common with the real name) or a transcription
# garble that collides with a different real player.
MANUAL_ALIASES = {
    # true nicknames: nothing to derive from
    "joker": "Evan Engram",
    # "kd": "George Kittle",
    "zach z": "Zach Ertz",
    "zack z": "Zach Ertz",
    "zacks": "Zach Ertz",            # else Zach Charbonnet, on the shared first name
    # transcription garbles that sound more like someone else than like the real player
    "hawinson": "T.J. Hockenson",    # else Jameis Winston
    "hinson": "T.J. Hockenson",      # else Xavier Hutchinson
    "andoku": "David Njoku",
    "david and david njoku": "David Njoku",
    "dinc concaid": "Dalton Kincaid",
    "bone knicks": "Bo Nix",
    "tyler shuck": "Tyler Shough",
    # "tyler lindendomb" -> Tyler Linderbaum used to live here; he is a center, so the
    # roster no longer caches him and the alias has nothing to point at. It only ever
    # existed to route a garble onto a player who could not be scored anyway.
}

# Proper nouns spaCy tags as PERSON that are not names of real people at all: segment
# names, the occasional deity, bare first names too common to mean anyone in particular.
# Matched on the whole name, so "Matt Gay" still passes.
UNWANTED_NAMES = {
    "rich", "dodson", "dotson",
    "matt", "o'hara",
    "g price", "g", "price",
    "garrett",
    "god",
    "taylor swift",
    "nerd herd", "nerd30",
    "chalky chalk",
    "jason", "andy", "mike",
}

# Real people who appear in fantasy podcasts but aren't players. These are handed to the
# resolver as decoys rather than filtered by exact match, because a transcript produces
# "Kell Moore" rather than "Kellen Moore" and an exact blocklist would miss it. Head
# coaches are fetched live by /nfl/athletes into nfl_non_players.json; what stays here is
# the shows' own hosts, which no API knows about.
NON_PLAYER_NAMES = {
    "Rich Dodson",
    "Matt O'Hara",
    "Matt Miller",
    "Jason Moore",
    "Andy Holloway",
    "Mike Wright",
}


def name_is_valid(name: str) -> bool:
    """False for proper nouns that are not NFL players."""
    return name.strip().lower() not in UNWANTED_NAMES


@functools.lru_cache(maxsize=16)
def _compile_rewrites(items: tuple) -> "re.Pattern":
    """Build one pattern covering every heard form, longest first.

    Each alternative carries its own guard against rewriting a name that is already
    correct. Without them, "travis" -> "Travis Kelce" turns an existing "Travis Kelce"
    into "Travis Kelce Kelce", and "bowers" -> "Brock Bowers" turns "Brock Bowers" into
    "Brock Brock Bowers", corrupting the premise the model scores.
    """
    alternatives = []
    # longest first, so "sam lapoora" wins over a bare "sam" that also needs rewriting
    for heard, canonical in sorted(items, key=lambda kv: -len(kv[0])):
        lowered = canonical.lower()
        before = after = ""
        # the heard form is the start of the canonical name: don't match when the rest of
        # that name already follows
        if lowered.startswith(heard) and len(lowered) > len(heard):
            rest = canonical[len(heard):].strip()
            if rest:
                after = rf"(?!\s+{re.escape(rest.split()[0])}\b)"
        # ...or the end of it: don't match when the earlier part already precedes
        if lowered.endswith(heard) and len(lowered) > len(heard):
            head = canonical[:len(canonical) - len(heard)].strip()
            if head:
                before = rf"(?<!{re.escape(head.split()[-1])}\s)"
        alternatives.append(rf"{before}\b{re.escape(heard)}\b{after}")

    return re.compile("|".join(alternatives), re.IGNORECASE)


def rewrite_names_in_sentence(sentence: str, rewrites: dict) -> str:
    """Replace heard names with their canonical roster spelling.

    The NLI step scores a (premise, hypothesis) pair where the hypothesis names the
    player explicitly, so the premise has to use the same spelling or the model is
    comparing against a name that never appears in the text.

    `rewrites` maps a heard surface form to a canonical name and is built per transcript
    from what actually resolved, rather than from a global table. Forms that already match
    their canonical spelling are included: they rewrite to themselves, but being in the
    pattern lets them consume the longer span before a bare first name can match inside it.
    """
    if not rewrites:
        return sentence

    pattern = _compile_rewrites(tuple(sorted(rewrites.items())))

    def replace(match):
        return rewrites.get(match.group(0).lower(), match.group(0))

    return pattern.sub(replace, sentence)
