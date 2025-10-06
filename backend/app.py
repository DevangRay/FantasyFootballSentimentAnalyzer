from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import analyzer as sentiment_analyzer

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3000",
])

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

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

@app.route("/analyze/example", methods=['GET'])
def analyzeExample():
    results = sentiment_analyzer.main()
    return jsonify(results)

@app.route('/nfl/athletes', methods=['GET'])
def get_nfl_athletes():
    print("in get_nfl_athletes")
    url = "https://partners.api.espn.com/v2/sports/football/nfl/athletes?limit=20000"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        print("data received")
        
        print(data)
        athletes_array = data['athletes']
        
        output_array = {}
        for athlete in athletes_array:
            athlete_object = {
                'id': athlete['id'],
                'team': athlete['team']['displayName']
            }
            print(athlete_object)
            
            output_array[athlete['displayName']] = athlete_object
        print("output_array constructed")
        # output_array = []
        # for athlete in athletes_array:
        #     athlete_object = {
        #         'id': athlete['id'],
        #         'name': athlete['displayName'],
        #         'team': athlete['team']['displayName']
        #     }
        #     print(athlete_object)
            
        #     output_array.append(athlete_object)
        print("writing to nfl_roster.json")
        with open('../resources/nfl_roster.json', 'w') as f:
            import json
            json.dump(output_array, f, ensure_ascii=False, indent=2)
        
        print("returning output_array")
        return jsonify(output_array)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500
    
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

if __name__ == '__main__':
    app.run(debug=True)