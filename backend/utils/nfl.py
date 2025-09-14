import requests
import json


def get_nfl_players():
    url = "https://partners.api.espn.com/v2/sports/football/nfl/athletes?limit=99999"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        athletes_array = data['athletes']
        
        output_array = []
        for athlete in athletes_array:
            athlete_object = {
                'name': athlete['displayName'],
                'team': athlete['team']['displayName']
            }            
            output_array.append(athlete_object['name'])
        
        with open("../resources/nfl_roster.json", "w", encoding="utf-8") as f:
            json.dump(output_array, f, ensure_ascii=False, indent=2)

        return output_array
    except requests.RequestException as e:
        return {'error': str(e)}, 500
    
def main():
    get_nfl_players()
    
if __name__ == "__main__":
    main()