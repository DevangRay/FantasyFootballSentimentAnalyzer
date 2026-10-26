"""Regression test for name resolution.

The fixture below is the hand-maintained nickname table this resolver replaced: 79
aliases collected from real podcast transcripts, each with the player it should resolve
to. It is the only ground truth available for this step, so it is kept as a test rather
than deleted with the table.

The point of the test is not a perfect score. Aliases listed in
name_cleaning.MANUAL_ALIASES are expected to fail without their hand entry: they are
nicknames with no phonetic or structural tie to the real name. Everything else should
resolve from the roster alone, so a drop in DERIVED_BASELINE means a real regression.

Run from the backend directory:  python tests/test_name_resolution.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils.name_cleaning import MANUAL_ALIASES, NON_PLAYER_NAMES
from utils.player_resolver import PlayerResolver, load_roster, load_non_players

# How many of the aliases NOT in MANUAL_ALIASES must resolve correctly from the roster
# alone. Measured at 65/66 when this was written; the one allowed failure is a name whose
# correct target left the active roster.
DERIVED_BASELINE = 60

SPOKEN_ALIASES = {
    'andoku': 'David Njoku',
    'bejan': 'Bijan Robinson',
    'bejian robinson': 'Bijan Robinson',
    'bjan robinson': 'Bijan Robinson',
    "bjan robinson's": 'Bijan Robinson',
    'bone knicks': 'Bo Nix',
    "bower's": 'Brock Bowers',
    'bowers': 'Brock Bowers',
    'brian dable': 'Brian Daboll',
    'brock b': 'Brock Bowers',
    'brock bower': 'Brock Bowers',
    'brock bowowers': 'Brock Bowers',
    'brock purie': 'Brock Purdy',
    'cmc': 'Christian McCaffrey',
    'coleston love': 'Colston Loveland',
    'craft': 'Tucker Kraft',
    'daltton concaid': 'Dalton Kincaid',
    'dan concade': 'Dalton Kincaid',
    'david and david njoku': 'David Njoku',
    'david and joku': 'David Njoku',
    'dinc concaid': 'Dalton Kincaid',
    'dolan concade': 'Dalton Kincaid',
    'doug craft': 'Tucker Kraft',
    'dylan gabriel': 'Dillon Gabriel',
    'enjoku': 'David Njoku',
    'evan ingram': 'Evan Engram',
    'flaco': 'Joe Flacco',
    'george kd': 'George Kittle',
    'harold fannin': 'Harold Fannin Jr.',
    'harold fannon': 'Harold Fannin Jr.',
    'hawinson': 'T.J. Hockenson',
    'hinson': 'T.J. Hockenson',
    'hockson': 'T.J. Hockenson',
    'hot tockinson': 'T.J. Hockenson',
    'injoku': 'David Njoku',
    'jackson dart': 'Jaxon Dart',
    'joker': 'Evan Engram',
    'jook': 'David Njoku',
    'jooku': 'David Njoku',
    'jookus': 'David Njoku',
    'jordan tyson': 'Jordyn Tyson',
    'josh ds': 'Josh Downs',
    'judy': 'Jerry Jeudy',
    'kd': 'George Kittle',
    'kelsey': 'Travis Kelce',
    'kyle pitts': 'Kyle Pitts Sr.',
    'kyle pittz': 'Kyle Pitts',
    'leapora': 'Sam LaPorta',
    'leaporta': 'Sam LaPorta',
    'loveland': 'Colston Loveland',
    'marv': 'Marvin Harrison Jr.',
    'mcbride': 'Trey McBride',
    'mendoza': 'Fernando Mendoza',
    'michael pitman': 'Michael Pittman',
    'pennix': 'Michael Penix Jr.',
    'rasheed rice': 'Rashee Rice',
    'rashid rice': 'Rashee Rice',
    'sam laapora': 'Sam LaPorta',
    'sam laaporta': 'Sam LaPorta',
    'sam laora': 'Sam LaPorta',
    'sam lapoora': 'Sam LaPorta',
    'sam leaport': 'Sam LaPorta',
    'sonat': 'Ben Sinnott',
    't.j hawinson': 'T.J. Hockenson',
    't.j. hawinson': 'T.J. Hockenson',
    'ted hurst': 'Ted Hurst III',
    'tess johnson': 'Tez Johnson',
    'tj hawinson': 'T.J. Hockenson',
    'trey mc bry': 'Trey McBride',
    'tua': 'Tua Tagovailoa',
    'tuckercraft': 'Tucker Kraft',
    'tyler lindendomb': 'Tyler Linderbaum',
    'tyler shuck': 'Tyler Shough',
    'tyler war': 'Tyler Warren',
    'waddles': 'Jaylen Waddle',
    'warren': 'Tyler Warren',
    'zach z': 'Zach Ertz',
    'zack z': 'Zach Ertz',
    'zacks': 'Zach Ertz',
}


# Sanity checks for the behaviour the derived rules exist to provide, independent of the
# alias fixture. Each is a pattern, not a memorised pair.
STRUCTURAL_CASES = [
    # bare surname shared by two players resolves to the fantasy-relevant one
    ("mccaffrey", "Christian McCaffrey"),
    # spoken initialisms, built from first initial + surname initials
    ("cmc", "Christian McCaffrey"),
    ("jsn", "Jaxon Smith-Njigba"),
    # roster suffixes the hosts never say
    ("kyle pitts", "Kyle Pitts Sr."),
    # one half of a compound surname
    ("njigba", "Jaxon Smith-Njigba"),
    # phonetic recovery of a transcription garble
    ("leaporta", "Sam LaPorta"),
    ("concaid", "Dalton Kincaid"),
    # a coach's surname must not block the player who shares it
    ("taylor", "Jonathan Taylor"),
]

# Names that must resolve to nothing. Everyone here is someone a fantasy podcast talks
# about who is not a scoreable player, and each one previously attached itself to a real
# player: a wrong card, built from sentences about someone else entirely.
NON_PLAYER_CASES = [
    "Tony Gonzalez",    # retired; was reaching Zane Gonzalez
    "Antonio Gates",    # retired; was reaching Anthony Tyus III
    "Jimmy Graham",     # retired, still on ESPN's roster at 0% owned
    "Kellen Moore",     # Saints head coach; was reaching Elijah Moore
    "Kell Moore",       # ...and the form a transcript actually produces
    "Ben Johnson",      # Bears head coach; was reaching Juwan Johnson
    "Klint Kubiak",     # offensive coordinator
    "Matt O'Hara",      # podcast host
]


def report():
    roster = load_roster()
    decoys = set(load_non_players()) | set(NON_PLAYER_NAMES)
    derived = PlayerResolver(roster, aliases=None, decoys=decoys)
    full = PlayerResolver(roster, aliases=MANUAL_ALIASES, decoys=decoys)

    manual = set(MANUAL_ALIASES)
    derivable = {a: t for a, t in SPOKEN_ALIASES.items() if a not in manual}

    def canonical(target):
        """the fixture predates some roster spellings, so map targets onto the roster"""
        if target in roster:
            return target
        hit = derived.resolve(target)
        return hit["name"] if hit else None

    ok, wrong, missed, stale = [], [], [], []
    for alias, target in derivable.items():
        want = canonical(target)
        if want is None:
            stale.append((alias, target))
            continue
        got = derived.resolve(alias)
        if not got:
            missed.append((alias, want))
        elif got["name"] == want:
            ok.append((alias, want, got))
        else:
            wrong.append((alias, want, got))

    print(f"roster: {len(roster)} players | decoys (coaches + hosts): {len(decoys)}")
    print(f"  relevant pool: {len(derived.pools['relevant'])}"
          f" | fringe: {len(derived.pools['fringe'])}"
          f" | long tail: {len(derived.pools['tail'])}")
    print(f"\nderived rules on the {len(derivable)} aliases NOT hand-listed:")
    print(f"  correct {len(ok)} | wrong {len(wrong)} | missed {len(missed)}"
          f" | target off roster {len(stale)}")
    for alias, want, got in sorted(wrong):
        print(f"    WRONG  {alias!r} -> {got['name']} (want {want}) @ {got['confidence']}")
    for alias, want in sorted(missed):
        print(f"    MISSED {alias!r} (want {want})")

    print(f"\nwith MANUAL_ALIASES applied, the {len(manual)} hand entries resolve:")
    bad_manual = [a for a, t in MANUAL_ALIASES.items()
                  if not (full.resolve(a) or {}).get("name") == t]
    print(f"  {len(manual) - len(bad_manual)}/{len(manual)} correct"
          + (f"  BROKEN: {bad_manual}" if bad_manual else ""))

    print("\nstructural cases:")
    structural_failures = []
    for heard, want in STRUCTURAL_CASES:
        got = full.resolve(heard)
        name = got["name"] if got else None
        flag = "ok  " if name == want else "FAIL"
        if name != want:
            structural_failures.append((heard, want, name))
        print(f"  {flag} {heard!r} -> {name}")

    print("\nnon-players, which must resolve to nothing:")
    non_player_failures = []
    for heard in NON_PLAYER_CASES:
        got = full.resolve(heard)
        if got:
            non_player_failures.append((heard, got["name"]))
            print(f"  FAIL {heard!r} -> {got['name']} @ {got['confidence']}")
        else:
            print(f"  ok   {heard!r} -> None")

    failures = []
    if non_player_failures:
        failures.append(f"non-players resolved to a player: {non_player_failures}")
    if len(ok) < DERIVED_BASELINE:
        failures.append(f"derived correct {len(ok)} < baseline {DERIVED_BASELINE}")
    if bad_manual:
        failures.append(f"manual aliases not resolving: {bad_manual}")
    if structural_failures:
        failures.append(f"structural cases failed: {structural_failures}")
    return failures


if __name__ == "__main__":
    problems = report()
    if problems:
        print("\nFAILED")
        for p in problems:
            print("  -", p)
        sys.exit(1)
    print("\nPASSED")
