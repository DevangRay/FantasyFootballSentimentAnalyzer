from flask import Flask, jsonify, request, Response, stream_with_context
from concurrent.futures import ThreadPoolExecutor
import json
import datetime
# import time
import os
from flask_cors import CORS
import requests

import analyzer as sentiment_analyzer
import sentiment_analysis.nli_deberta_v3_base as nli
import utils.player_resolver as player_resolver

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000",
    "https://fantasy-football-sentiment-analyzer.vercel.app",
])

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

# ENDPOINT WITH MESSAGES FOR PROGRESS BAR
@app.route("/analyze_stream", methods=['POST'])
def analyze_stream():
    print("/analyze_stream endpoint hit")
    # print("transcript is: ")
    data = request.get_json()
    print("data received in analyze_stream endpoint")
    
    
    transcript = data.get('transcript', None)
    
    if (not transcript):
        return jsonify({"error": "No transcript provided"}), 469

    def generate():
        try:
            # Step 1
            yield f"data: {json.dumps({'progress': 10, 'message': 'Processing transcript...'})}\n\n"
            identified_names, raw_sentences = sentiment_analyzer.process_transcript(podcast_transcript_text=transcript)
            print("Total Identified Names:", len(identified_names))

            # Step 2
            yield f"data: {json.dumps({'progress': 25, 'message': 'Identifying NFL players...'})}\n\n"
            final_player_object, analysis_sentences = sentiment_analyzer.match_players_to_roster(identified_names, raw_sentences)
            print("Total Unique Players Mentioned:", len(final_player_object))

            # Step 3
            # yield per-player so the stream stays alive during inference
            yield f"data: {json.dumps({'progress': 50, 'message': 'Running sentiment analysis...'})}\n\n"
            player_sentiments = {}
            for player_name, player_result, current, total in nli.analyze_sentiment(final_player_object, analysis_sentences):
                player_sentiments[player_name] = player_result
                pct = 50 + int((current / total) * 48)  # 50% to 98%
                yield f"data: {json.dumps({'progress': pct, 'message': f'Analyzing {player_name} ({current}/{total})...'})}\n\n"
            print("Total Players with Sentiment Analysis:", len(player_sentiments))

            # Step 4
            # yield f"data: {json.dumps({'progress': 90, 'message': 'Aggregating consensus scores...'})}\n\n"

            # Done — send final payload
            print("Sending final results")
            yield f"data: {json.dumps({'progress': 100, 'message': 'Complete', 'result': player_sentiments})}\n\n"
        except GeneratorExit:
            print("Client disconnected, stopping stream")

    return Response(stream_with_context(generate()), mimetype='text/event-stream')

# SETTING UP ANALYSIS (CHECK)
@app.route("/analyze/setup", methods=['POST'])
def analyzeSetup():
    print("analyze/setup endpoint hit")
    print("transcript is: ")
    data = request.get_json()
    
    transcript = data.get('transcript', None)
    
    if (not transcript):
        return jsonify({"error": "No transcript provided"}), 400
    
    print("transcript received, analyzing...")
    response = sentiment_analyzer.set_up_to_analyze(transcript)
    
    return jsonify(response)

# Positions that can score fantasy points. Used to narrow the ~6,900-player roster down
# to the few hundred a fantasy podcast could plausibly be talking about.
FANTASY_POSITIONS = {"QB", "RB", "WR", "TE", "PK", "K", "FB"}


def get_fantasy_ownership():
    """Fetch percent-owned per player id from ESPN's fantasy API.

    This is the relevance prior the name resolver uses to break ties: when a transcript
    says only "McCaffrey", Christian (99.9% owned) beats Luke (1.4%) without anyone
    hand-writing that exception. Returns {} if the call fails, in which case the resolver
    falls back to treating every active fantasy-position player as equally plausible.
    """
    season = datetime.date.today().year
    # ESPN rolls the fantasy season over mid-year; before September, last season's data
    # is the live one. Preseason starts in August.
    if datetime.date.today().month < 7:
        season -= 1

    url = f"https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{season}/segments/0/leaguedefaults/3"
    headers = {
        "X-Fantasy-Filter": json.dumps({
            "players": {"limit": 2000, "sortPercOwned": {"sortAsc": False, "sortPriority": 1}}
        }),
        "User-Agent": "Mozilla/5.0",
    }
    try:
        response = requests.get(url, params={"view": "kona_player_info"},
                                headers=headers, timeout=60)
        response.raise_for_status()
        players = response.json().get("players", [])
        ownership = {}
        for entry in players:
            player = entry.get("player", {})
            owned = (player.get("ownership") or {}).get("percentOwned")
            if player.get("id") is not None and owned is not None:
                ownership[str(player["id"])] = round(owned, 2)
        print(f"fantasy ownership fetched for {len(ownership)} players (season {season})")
        return ownership
    except (requests.RequestException, ValueError) as e:
        print(f"could not fetch fantasy ownership, continuing without it: {e}")
        return {}


def get_nfl_coaches():
    """Fetch current head coach names from ESPN.

    Coaches get discussed constantly on fantasy podcasts and share surnames with players,
    so without them "Kellen Moore" (Saints head coach) lands on Elijah Moore and
    "Ben Johnson" (Bears head coach) on whichever Johnson is closest. The resolver takes
    these as decoys to match against, which also catches the garbled forms a transcript
    actually produces. Returns [] on failure; the resolver simply has fewer decoys.
    """
    season = datetime.date.today().year
    index_url = (f"https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/"
                 f"seasons/{season}/coaches?limit=200")
    try:
        items = requests.get(index_url, timeout=30).json().get("items", [])
        names = []
        # 32 refs, one request each, on a weekly refresh
        with ThreadPoolExecutor(max_workers=8) as pool:
            for coach in pool.map(
                lambda item: requests.get(item["$ref"], timeout=30).json(), items
            ):
                name = coach.get("displayName") or " ".join(
                    filter(None, [coach.get("firstName"), coach.get("lastName")])
                )
                if name.strip():
                    names.append(name.strip())
        print(f"fetched {len(names)} head coaches (season {season})")
        return sorted(set(names))
    except (requests.RequestException, ValueError, KeyError) as e:
        print(f"could not fetch coaches, continuing without them: {e}")
        return []


# GET NFL ATHLETES
@app.route('/nfl/athletes', methods=['GET'])
def get_nfl_athletes():
    print("in get_nfl_athletes")
    url = "https://partners.api.espn.com/v2/sports/football/nfl/athletes?limit=20000"
    try:
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        data = response.json()
        print("data received")

        athletes_array = data['athletes']
        ownership = get_fantasy_ownership()

        output_array = {}
        skipped = {'position': 0, 'inactive': 0}
        for athlete in athletes_array:
            position = (athlete.get('position') or {}).get('abbreviation')
            is_active = (athlete.get('status') or {}).get('type') == 'active'
            percent_owned = ownership.get(athlete['id'], 0.0)

            # Only players who could appear in a fantasy sentiment report are cached.
            # Everyone else is a source of wrong answers rather than missing ones: a
            # retired tight end named as a comparison, or a lineman mentioned in passing,
            # has no business holding one of the 20 inference slots.
            if position not in FANTASY_POSITIONS:
                skipped['position'] += 1
                continue
            # Ownership overrides ESPN's `active` flag, which lags reality for injured
            # players: Davante Adams, Tyreek Hill and De'Von Achane all report as inactive
            # while still rostered in most leagues and discussed every week. Filtering on
            # `active` alone would drop 246 owned players.
            if not is_active and percent_owned <= 0:
                skipped['inactive'] += 1
                continue

            output_array[athlete['displayName']] = {
                'id': athlete['id'],
                'team': (athlete.get('team') or {}).get('displayName'),
                'position': position,
                'active': is_active,
                'fantasy_position': True,
                'percent_owned': percent_owned,
                'first_name': athlete.get('firstName'),
                'last_name': athlete.get('lastName'),
            }
        print(f"output_array constructed ({len(output_array)} players kept of {len(athletes_array)}; "
              f"skipped {skipped['position']} non-fantasy positions, "
              f"{skipped['inactive']} inactive and unowned). writing to nfl_roster.json")

        with open('./resources/nfl_roster.json', 'w', encoding='utf-8') as f:
            json.dump(output_array, f, ensure_ascii=False, indent=2)

        coaches = get_nfl_coaches()
        if coaches:
            with open('./resources/nfl_non_players.json', 'w', encoding='utf-8') as f:
                json.dump(coaches, f, ensure_ascii=False, indent=2)

        # the resolver indexes the roster at first use; drop it so the next analysis
        # request rebuilds against the file just written
        player_resolver.reset_resolver()

        print("returning output_array")
        return jsonify(output_array)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500
    
    
# GET PHOTO OF SPECIFIC NFL PLAYER
@app.route("/nfl/athlete/photo/<player_id>", methods=['GET'])
def get_player_photo(player_id):
    # https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15847.png
    url = f"https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/{player_id}.png"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return jsonify({"photo_url": url})
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

# CI sanity check
@app.route('/nfl/roster/meta', methods=['GET'])
def get_roster_meta():
    path = './resources/nfl_roster.json'
    with open(path, 'r') as f:
        roster = json.load(f)
    
    modification_time = os.path.getmtime(path)
    local_datetime = datetime.datetime.fromtimestamp(modification_time)
    readable_time = local_datetime.strftime('%Y-%m-%d %H:%M:%S %Z')
        
    return jsonify({
        'player_count': len(roster),
        'last_updated': readable_time,
    })


if __name__ == '__main__':
    app.run(debug=True)