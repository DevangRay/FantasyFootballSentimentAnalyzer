from flask import Flask, jsonify
import requests
import analyzer as sentiment_analyzer

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/analyze", methods=['GET'])
def analyze():
    results = sentiment_analyzer.main()
    return jsonify(results)

@app.route('/nfl/athletes', methods=['GET'])
def get_nfl_athletes():
    url = "https://partners.api.espn.com/v2/sports/football/nfl/athletes?limit=20000"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        print(data)
        athletes_array = data['athletes']
        
        output_array = []
        for athlete in athletes_array:
            athlete_object = {
                'name': athlete['displayName'],
                'team': athlete['team']['displayName']
            }
            print(athlete_object)
            
            output_array.append(athlete_object['name'])
            
        with open('../resources/nfl_roster.json', 'w') as f:
            import json
            json.dump(output_array, f, ensure_ascii=False, indent=2)
        
        return jsonify(output_array)
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500
    
@app.route("/nfl/player/photo/<player_id>", methods=['GET'])
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