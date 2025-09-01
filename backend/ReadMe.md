# Set-up instructions
- create .venv 
    - `python -m venv .venv`
- run venv 
    - `.venv\Scripts\activate`
- install required packages 
    - `pip install -r /path/to/requirements.txt`
- run Flask app 
    - `flask --app [PATH TO *.py file]` run
        - run with `--debug` flag for live code updates during development

### For more help with Flask
* https://flask.palletsprojects.com/en/stable/quickstart/

# Transcribing
- `whisperx ..\resources\rookie_te_breakout_incoming!_top_12_tes_for_fantasy_football_2025.wav --compute_type int8 --min_speakers 3 --max_speakers 3`
    -- needs ffmpeg