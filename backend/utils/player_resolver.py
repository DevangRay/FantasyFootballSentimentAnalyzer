"""Resolve spoken/mis-transcribed player names to canonical NFL roster entries.

Replaces the hand-maintained nickname lookup table with rules derived from the roster
itself, so a transcript from a show the mapping has never seen still resolves.

Four things do the work:

1. Relevance pools. The roster holds ~6,900 players but only a few hundred are
   plausible subjects of a fantasy podcast. ESPN's fantasy API supplies `percent_owned`
   per player, which splits the roster into "relevant" (owned by real fantasy leagues),
   "fringe" (active at a fantasy position) and the long tail. Searching the relevant pool
   first is what makes a bare surname like "mccaffrey" resolve to Christian and not Luke,
   with no hand-written exception.

2. Component scoring. A heard name is scored against a candidate's first name and
   surname separately rather than as one string, so "dolan concade" matches
   Dalton Kincaid on both halves instead of colliding with some unrelated full name.

3. Phonetic similarity. Automated transcription mangles proper nouns, but it usually
   preserves how the name sounds. Double Metaphone keys catch "leaporta" -> LaPorta
   and "concaid" -> Kincaid. Phonetic agreement *lifts* a spelling score rather than
   replacing it, because short tokens collide acoustically far too easily
   ("joker"/"jacory" share a metaphone key but are not the same person).

4. Transcript context. Podcasts introduce a player in full, then shorten. A full-name
   mention elsewhere in the same transcript makes a later bare "Tucker" resolve to
   Tucker Kraft instead of Tre Tucker. See `build_context`.

A small residual alias table still lives in name_cleaning.MANUAL_ALIASES for nicknames
no rule can derive ("joker" for Evan Engram, "KD" for George Kittle).
"""

import functools
import json
import os
import re
import unicodedata
from collections import defaultdict

from metaphone import doublemetaphone
from rapidfuzz import fuzz

SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}

# surname prefixes that carry their own spoken initial, so "McCaffrey" contributes
# both M and C and "CMC" resolves to Christian McCaffrey
SPLIT_PREFIXES = ("mc", "mac", "st", "la", "le", "de", "van", "von", "du")

# --- component similarity tuning -------------------------------------------------
# A phonetic key match sets a floor under the spelling score; it never replaces it.
KEY_EQ_BASE = 0.60      # identical metaphone keys -> floor = BASE + SPAN * spelling
KEY_NE_BASE = 0.52      # merely similar metaphone keys
KEY_SPAN = 0.40
KEY_NE_CUTOFF = 0.80    # metaphone-key similarity required to count as "similar"
SHORT_TOKEN = 4         # under this length, phonetic agreement is weak evidence

# --- confidence bands reported to the caller -------------------------------------
CONF_HIGH = 0.86        # effectively always correct on the development alias set
CONF_PROBABLE = 0.78

# Positions that can score fantasy points.
FANTASY_POSITIONS = {"QB", "RB", "WR", "TE", "PK", "K", "FB"}


def is_analyzable(meta: dict) -> bool:
    """Is this roster entry someone a fantasy podcast could be discussing?

    Retired players get named constantly as comparisons ("he's the next Antonio Gates")
    and defensive players turn up in passing, but neither belongs in a fantasy sentiment
    report, so they are dropped before inference.

    Ownership outranks ESPN's `active` flag deliberately. That flag lags reality for
    injured players: Davante Adams, Tyreek Hill and De'Von Achane all read as inactive
    while still being rostered in most leagues and talked about every week. Any ownership
    at all is therefore taken as proof a player is live, and `active` only decides the
    cases ESPN reports no ownership for.
    """
    if not meta.get("fantasy_position", True):
        return False
    return bool(meta.get("active", True)) or (meta.get("percent_owned") or 0.0) > 0


def normalize(s: str) -> str:
    """Lowercase, strip accents/punctuation, collapse whitespace."""
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    s = s.lower().strip()
    s = re.sub(r"[.’']", "", s)
    s = re.sub(r"[^a-z0-9\s-]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


# memoizes the keys
@functools.lru_cache(maxsize=1 << 18)
def _keys(s: str) -> frozenset:
    """Double Metaphone keys for a string, empties dropped."""
    return frozenset(k for k in doublemetaphone(s) if k)


PREFIX_MIN_LEN = 3      # shortest truncation treated as a deliberate shortening
PREFIX_SIM = 0.86       # "tyler war" -> Tyler Warren, "coleston love" -> Loveland


# memoizes the key similarity computation
@functools.lru_cache(maxsize=1 << 20)
def component_similarity(heard: str, actual: str) -> float:
    """How alike are two name components, by spelling lifted by how alike they sound.

    A heard component that is a prefix of the real one scores highly regardless of
    length, because hosts routinely clip a surname mid-word. This is what separates a
    genuine shortening ("war" for Warren) from an unrelated name that merely shares a
    few letters ("gates" against "tyus").
    """
    if not heard or not actual:
        return 0.0
    spelling = fuzz.ratio(heard, actual) / 100.0
    if spelling >= 0.999:
        return 1.0
    if len(heard) >= PREFIX_MIN_LEN and actual.startswith(heard):
        spelling = max(spelling, PREFIX_SIM)

    kh, ka = _keys(heard), _keys(actual)
    if kh & ka:
        floor = KEY_EQ_BASE + KEY_SPAN * spelling
    else:
        key_sim = max((fuzz.ratio(x, y) for x in kh for y in ka), default=0) / 100.0
        floor = (KEY_NE_BASE + KEY_SPAN * spelling) if key_sim >= KEY_NE_CUTOFF else 0.0

    if min(len(heard), len(actual)) < SHORT_TOKEN:
        floor *= 0.85
    return max(spelling, floor)


class PlayerResolver:
    """Resolves a heard name to one roster entry, or to None."""

    ACCEPT = 0.72            # below this, report no match rather than guess
    PRIOR_BAND = 0.03        # confidences this close are ordered by fantasy relevance
    CTX_BOOST = 0.10         # nudge for players named in full elsewhere in the transcript

    # weight per match shape
    W_FULL = 0.97
    W_SURNAME = 0.93
    W_SURNAME_PART = 0.88
    W_INITIALISM = 0.88
    W_FIRST_INITIAL = 0.87
    W_FIRST = 0.86
    W_CONCAT = 0.90          # one run-together token vs a whole name ("leaporta")
    CONCAT_MIN = 0.85
    W_CONCAT_MULTI = 0.88    # multi-token vs a whole name; component scoring is better
    CONCAT_MULTI_MIN = 0.93
    # The surname carries the identity, so a two-token name needs a decent surname match
    # before its first name can carry it. Without this, retired players named as
    # comparisons ("Antonio Gates") latch onto whoever is currently on the roster.
    MIN_SURNAME_SIM = 0.72
    # The converse: a shared surname is not enough on its own. Coaches, hosts and retired
    # players have no roster entry, so "Kellen Moore" (a head coach) would otherwise ride
    # a perfect "Moore" onto Elijah Moore, and "Tony Gonzalez" onto Zane Gonzalez. Real
    # variation in a first name stays well clear of this ("jir" for Jahmyr scores 0.59).
    MIN_FIRST_SIM = 0.50

    POOL_PENALTY = {"relevant": 1.00, "fringe": 0.97, "tail": 0.95}
    # the long tail is mostly retired/practice-squad players; it needs a near-complete
    # name to win, so a bare surname never resolves to someone nobody is discussing
    TAIL_MIN_CONF = 0.88
    TAIL_TIERS = ("full", "full-concat")

    # A decoy has to beat the best player by this much to suppress the match, so a
    # surname shared by a coach and a player ("Taylor") still resolves to the player.
    DECOY_MARGIN = 0.02

    def __init__(self, roster: dict, aliases: dict = None, relevance_floor: float = 0.5,
                 decoys=None):
        self.roster = roster
        self.aliases = {normalize(k): v for k, v in (aliases or {}).items() if v in roster}
        self.entries = {}
        self.pool_of = {}
        self.pools = {"relevant": [], "fringe": [], "tail": []}
        self.tail_index = defaultdict(set)

        # a roster predating the enrichment has no ownership data at all; without it
        # every player would land in the tail and nothing would resolve
        has_ownership = any(m.get("percent_owned") for m in roster.values())

        for name, meta in roster.items():
            tokens = normalize(name).split()
            first = normalize(meta.get("first_name") or (tokens[0] if tokens else ""))
            last_tokens = normalize(
                meta.get("last_name") or " ".join(tokens[1:])
            ).split()
            last = " ".join(t for t in last_tokens if t not in SUFFIXES)
            if not last and len(tokens) > 1:
                last = tokens[-1]
            full = " ".join(t for t in tokens if t not in SUFFIXES)
            parts = tuple(p for p in re.split(r"[-\s]+", last) if len(p) > 2)

            self.entries[name] = (
                first, last, full, parts, self._initialisms(first, last, last_tokens),
            )

            owned = meta.get("percent_owned") or 0.0
            is_fantasy = meta.get("active", True) and meta.get("fantasy_position", True)
            if has_ownership and owned > relevance_floor:
                pool = "relevant"
            elif is_fantasy:
                pool = "fringe"
            else:
                pool = "tail"

            self.pool_of[name] = pool
            self.pools[pool].append(name)
            if pool == "tail":
                for source in filter(None, [last.replace(" ", ""), full.replace(" ", "")]):
                    for key in _keys(source):
                        self.tail_index[key].add(name)

        # the pools searched exhaustively; the tail is reached only via its phonetic index
        self._searched = self.pools["relevant"] + self.pools["fringe"]

        # Decoys are people who turn up in a fantasy podcast but are not players: head
        # coaches, and the show's own hosts. They are scored with the same machinery as
        # players, and a heard name that fits a decoy better than any player resolves to
        # nothing. Matching them is what makes it work on garbles -- a blocklist would
        # catch "Kellen Moore" but not the "Kell Moore" a transcript actually produces.
        self.decoys = {}
        for decoy in (decoys or ()):
            tokens = normalize(decoy).split()
            if not tokens:
                continue
            first = tokens[0]
            last = " ".join(t for t in tokens[1:] if t not in SUFFIXES)
            full = " ".join(t for t in tokens if t not in SUFFIXES)
            parts = tuple(p for p in re.split(r"[-\s]+", last) if len(p) > 2)
            self.decoys[decoy] = (first, last, full, parts, frozenset())

    @staticmethod
    def _initialisms(first: str, last: str, last_tokens: list) -> frozenset:
        """Spoken initialisms a name can produce: CMC, JSN, MHJ, ARSB."""
        if not (first and last):
            return frozenset()
        initials = [first[0]]
        for part in re.split(r"[-\s]+", last):
            if not part:
                continue
            initials.append(part[0])
            for prefix in SPLIT_PREFIXES:
                if part.startswith(prefix) and len(part) > len(prefix):
                    initials.append(part[len(prefix)])
                    break

        out = {"".join(initials)}
        suffix = [t for t in last_tokens if t in SUFFIXES]
        if suffix:
            out.add("".join(initials + [suffix[0][0]]))
        return frozenset(i for i in out if len(i) >= 2)

    def _score(self, query_tokens: list, query_flat: str, name: str):
        """Best confidence and match shape for one roster candidate."""
        return self._score_entry(query_tokens, query_flat, self.entries[name])

    def _score_entry(self, query_tokens: list, query_flat: str, entry: tuple):
        """Best confidence and match shape for one candidate's name components."""
        first, last, full, parts, initialisms = entry
        query = " ".join(query_tokens)
        best, tier = 0.0, None

        def bid(confidence, shape):
            nonlocal best, tier
            if confidence > best:
                best, tier = confidence, shape

        if query_flat in initialisms:
            bid(self.W_INITIALISM, "initialism")

        if len(query_tokens) == 1:
            bid(self.W_SURNAME * component_similarity(query, last), "surname")
            bid(self.W_FIRST * component_similarity(query, first), "firstname")
            for part in parts:
                bid(self.W_SURNAME_PART * component_similarity(query, part), "surname-part")
            # one token covering the whole name: "leaporta", "bonix"
            concat = component_similarity(query_flat, full.replace(" ", ""))
            if concat >= self.CONCAT_MIN:
                bid(self.W_CONCAT * concat, "full-concat")
        else:
            sim_first = component_similarity(query_tokens[0], first)
            sim_last = component_similarity(" ".join(query_tokens[1:]), last)
            if sim_last >= self.MIN_SURNAME_SIM and sim_first >= self.MIN_FIRST_SIM:
                bid(0.35 * sim_first + 0.65 * sim_last, "full")
            # A compound surname spoken on its own: "st brown", "smith njigba". Only when
            # the real surname is itself multi-token -- otherwise a first-name-plus-surname
            # query scores against the surname alone just because it contains it, which is
            # how "tony gonzalez" (retired) reached Zane Gonzalez at 0.83.
            if " " in last or "-" in last:
                bid(self.W_SURNAME * component_similarity(query, last), "surname")
            # "brock b", "george k": first name plus the surname's leading initial
            tail_token = query_tokens[-1]
            if len(tail_token) <= 2 and sim_first >= 0.80 and last.startswith(tail_token[0]):
                bid(self.W_FIRST_INITIAL * sim_first, "first+initial")
            concat = component_similarity(query_flat, full.replace(" ", ""))
            if concat >= self.CONCAT_MULTI_MIN:
                bid(self.W_CONCAT_MULTI * concat, "full-concat")

        return best, tier

    def _candidates(self, query_flat: str) -> list:
        tail = set()
        for key in _keys(query_flat):
            tail |= self.tail_index.get(key, set())
        return self._searched + list(tail)

    def resolve(self, heard_name: str, context: dict = None) -> dict:
        """Resolve one heard name. `context` maps canonical name -> full-mention count."""
        query = normalize(heard_name)
        if not query:
            return None

        if query in self.aliases:
            return self._result(self.aliases[query], 1.0, "manual-alias", 1.0)

        # a trailing s is as often a possessive or a transcription artifact as it is real
        forms = {query, re.sub(r"s$", "", query)} if len(query) > 3 else {query}

        scored = {}
        for form in forms:
            tokens = [t for t in form.split() if t not in SUFFIXES] or form.split()
            flat = "".join(tokens)
            for name in self._candidates(flat):
                confidence, tier = self._score(tokens, flat, name)
                pool = self.pool_of[name]
                confidence *= self.POOL_PENALTY[pool]
                if pool == "tail" and (
                    confidence < self.TAIL_MIN_CONF or tier not in self.TAIL_TIERS
                ):
                    continue
                if confidence > scored.get(name, (0.0,))[0]:
                    scored[name] = (confidence, tier)

        viable = [(n, c, t) for n, (c, t) in scored.items() if c >= self.ACCEPT]
        if not viable:
            return None

        def rank(entry):
            name, confidence, _ = entry
            prior = (self.roster[name].get("percent_owned") or 0.0) / 100.0
            boost = self.CTX_BOOST if (context and context.get(name)) else 0.0
            # band the confidence so relevance and context break near-ties without
            # ever overriding a clearly better match
            return (round((confidence + boost) / self.PRIOR_BAND), prior, confidence)

        viable.sort(key=rank, reverse=True)
        name, confidence, tier = viable[0]

        # A coach or host who fits better than any player means this mention is not about
        # a player at all. Anchored players are exempt: the transcript has already proved
        # it is discussing them.
        if not (context and context.get(name)):
            decoy_name, decoy_conf = self._best_decoy(forms)
            if decoy_conf > confidence + self.DECOY_MARGIN:
                return None

        runner_up = viable[1][1] if len(viable) > 1 else 0.0
        return self._result(name, confidence, tier, confidence - runner_up)

    def _best_decoy(self, forms):
        """Best (name, confidence) among the known non-players, over the same query forms."""
        best_name, best_conf = None, 0.0
        if not self.decoys:
            return best_name, best_conf
        for form in forms:
            tokens = [t for t in form.split() if t not in SUFFIXES] or form.split()
            flat = "".join(tokens)
            for name, entry in self.decoys.items():
                confidence, _ = self._score_entry(tokens, flat, entry)
                if confidence > best_conf:
                    best_name, best_conf = name, confidence
        return best_name, best_conf

    def _result(self, name: str, confidence: float, tier: str, margin: float) -> dict:
        meta = self.roster[name]
        if confidence >= CONF_HIGH:
            band = "high"
        elif confidence >= CONF_PROBABLE:
            band = "probable"
        else:
            band = "low"
            
        return {
            "name": name,
            "player_id": meta.get("id"),
            "team": meta.get("team"),
            "position": meta.get("position"),
            "confidence": round(confidence, 3),
            "band": band,
            "match_tier": tier,
            "margin": round(margin, 3),
            "percent_owned": meta.get("percent_owned", 0.0),
            "analyzable": is_analyzable(meta),
        }

    # Match shapes that pin one specific player, because they reference more than just a
    # surname or just a first name. Anchors are drawn only from these: a bare "Travis"
    # must not anchor anything, or first-name collisions would reinforce themselves.
    ANCHOR_TIERS = ("full", "full-concat", "initialism", "first+initial", "manual-alias")
    ANCHOR_MIN_CONF = 0.84
    ANCHOR_MIN_MARGIN = 0.05

    def build_context(self, heard_names) -> dict:
        """Count the players this transcript names in a way that identifies them outright.

        Those become anchors: a later bare surname or first name in the same transcript is
        nudged toward a player the hosts have already introduced properly. Keyed on match
        shape rather than a flat confidence cutoff, because the weight ceiling differs per
        shape -- "George KD" tops out at 0.87 as a first-name-plus-initial match but still
        names George Kittle unambiguously.
        """
        anchors = defaultdict(int)
        for heard in heard_names:
            hit = self.resolve(heard)
            if (hit
                    and hit["match_tier"] in self.ANCHOR_TIERS
                    and hit["confidence"] >= self.ANCHOR_MIN_CONF
                    and hit["margin"] >= self.ANCHOR_MIN_MARGIN):
                anchors[hit["name"]] += 1
        return dict(anchors)


_DEFAULT_ROSTER_PATHS = (
    "./resources/nfl_roster.json",
    os.path.join(os.path.dirname(__file__), "..", "resources", "nfl_roster.json"),
)

_resolver = None


def load_roster(path: str = None) -> dict:
    for candidate in ([path] if path else _DEFAULT_ROSTER_PATHS):
        if candidate and os.path.exists(candidate):
            with open(candidate, "r", encoding="utf-8") as f:
                return json.load(f)
    raise FileNotFoundError("nfl_roster.json not found")


_NON_PLAYER_PATHS = (
    "./resources/nfl_non_players.json",
    os.path.join(os.path.dirname(__file__), "..", "resources", "nfl_non_players.json"),
)


def load_non_players() -> list:
    """Head coaches fetched by /nfl/athletes, if the file is there yet."""
    for candidate in _NON_PLAYER_PATHS:
        if os.path.exists(candidate):
            with open(candidate, "r", encoding="utf-8") as f:
                return list(json.load(f))
    return []


def get_resolver(path: str = None) -> PlayerResolver:
    """Process-wide resolver; the index build is a few hundred ms, so do it once."""
    global _resolver
    if _resolver is None:
        from utils.name_cleaning import MANUAL_ALIASES, NON_PLAYER_NAMES

        decoys = set(load_non_players()) | set(NON_PLAYER_NAMES)
        _resolver = PlayerResolver(load_roster(path), aliases=MANUAL_ALIASES, decoys=decoys)
    return _resolver


def reset_resolver():
    """Drop the cached resolver so the next call picks up a refreshed roster file."""
    global _resolver
    _resolver = None
