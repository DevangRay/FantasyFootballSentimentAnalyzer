from flask import Flask, jsonify, request, Response, stream_with_context
import json
import datetime
import time
import os
from flask_cors import CORS
import requests

import analyzer as sentiment_analyzer
import sentiment_analysis.nli_deberta_v3_base as nli

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000",
    "https://fantasy-football-sentiment-analyzer.vercel.app",
])

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

# SYNCHRONOUS ANALYSIS ENDPOINT
@app.route("/analyze", methods=['POST'])
def analyze():
    print("analyze endpoint hit")
    print("transcript is: ")
    data = request.get_json()
    print(data)
    
    
    transcript = data.get('transcript', None)
    
    if (not transcript):
        return jsonify({"error": "No transcript provided"}), 469
    
    print("transcript received, analyzing...")
    response = sentiment_analyzer.analyze(transcript)
    
    return jsonify(response)

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
            final_player_object = sentiment_analyzer.match_players_to_roster(identified_names)
            print("Total Unique Players Mentioned:", len(final_player_object))

            # Step 3
            yield f"data: {json.dumps({'progress': 50, 'message': 'Running sentiment analysis...'})}\n\n"
            player_sentiments = nli.analyze_sentiment(final_player_object, raw_sentences)
            print("Total Players with Sentiment Analysis:", len(player_sentiments))

            # Step 4
            yield f"data: {json.dumps({'progress': 90, 'message': 'Aggregating consensus scores...'})}\n\n"
            print("Starting delay...")
            time.sleep(2)
            print("Delay completed after 2 seconds.")

            # Done — send final payload
            print("Sending final results...")
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

# GET NFL ATHLETES 
@app.route('/nfl/athletes', methods=['GET'])
def get_nfl_athletes():
    print("in get_nfl_athletes")
    url = "https://partners.api.espn.com/v2/sports/football/nfl/athletes?limit=20000"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        print("data received")
        
        athletes_array = data['athletes']
        
        output_array = {}
        for athlete in athletes_array:
            athlete_object = {
                'id': athlete['id'],
                'team': athlete['team']['displayName']
            }
            print(athlete_object)
            
            output_array[athlete['displayName']] = athlete_object
        print("output_array constructed. writing to nfl_roster.json")
        
        with open('./resources/nfl_roster.json', 'w') as f:
            json.dump(output_array, f, ensure_ascii=False, indent=2)
        
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