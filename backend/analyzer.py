import spacy

import json

import utils.name_cleaning as name_cleaning
import utils.player_resolver as player_resolver
import sentiment_analysis.nli_deberta_v3_base as nli

nlp = spacy.load("en_core_web_md")
sentencizer = nlp.add_pipe("sentencizer")
    
def process_transcript(podcast_transcript_filepath=None, podcast_transcript_text=None )-> tuple[list[dict], list[str]]:
    # read transcript file to variable raw_transcript
    raw_transcript = ""
    if (podcast_transcript_filepath):
        print("reading transcript from file")
        raw_transcript = open(podcast_transcript_filepath, "r", encoding="utf-8").read()
    elif podcast_transcript_text:
        print("reading transcript from text input")
        raw_transcript = podcast_transcript_text
    else: 
        return ValueError("Either podcast_transcript_filepath or podcast_transcript_text must be provided.")
    
    # use spacy to split raw_transcript into sentences and identify named entities
    doc = nlp(raw_transcript)
    raw_sentences = list(doc.sents)
    
    # create list of identified names, associated with the sentence index and the sentence itself
    identified_names = []
    for i, sent in enumerate(raw_sentences, start=0):
        names = [ent.text for ent in sent.ents if ent.label_ == "PERSON"]
        for name in names:
            # Remove leading articles from the name (e.g., "a Jackson Dart" -> "Jackson Dart")
            cleaned_name = name.strip()
            for article in ["a ", "an ", "the "]:
                if cleaned_name.lower().startswith(article):
                    cleaned_name = cleaned_name[len(article):]

            # names are kept as heard; resolving them to the roster happens in
            # match_players_to_roster, which needs the whole transcript's mentions at once
            if name_cleaning.name_is_valid(cleaned_name):
                identified_names.append({
                    "name": cleaned_name,
                    "sentence_index": i,
                    "sentence": sent.text.strip()
                })

    # DEBUG
    # for identified_name in identified_names:
    #     print(f"{identified_name['name']} | {identified_name['sentence_index']} | {identified_name['sentence']}")

    return identified_names, raw_sentences


def match_players_to_roster(identified_names: list[dict], raw_sentences: list = None) -> tuple[dict, list[str]]:
    """Resolve every heard name to a roster player.

    Returns the per-player occurrence object and the transcript's sentences with
    canonical player names substituted in, which is what the NLI step scores against.

    Resolution runs in two passes. The first finds the players this transcript names in
    full and unambiguously; the second re-resolves everything with those as context, so a
    bare "Tucker" becomes Tucker Kraft when the hosts introduced him properly earlier,
    instead of some other Tucker on the roster.
    """
    resolver = player_resolver.get_resolver()

    heard_names = [entry['name'] for entry in identified_names]
    context = resolver.build_context(set(heard_names))
    print(f"Context anchors from full-name mentions: {len(context)}")

    # one resolve per distinct spelling, not per mention
    resolved = {name: resolver.resolve(name, context=context) for name in set(heard_names)}

    # Drop anyone who resolved to a player the report has no business scoring: retired
    # players invoked as comparisons, and defensive or offensive-line players mentioned in
    # passing. They are matched first and discarded second on purpose -- letting a retired
    # name resolve to itself stops it attaching to an active player who sounds similar.
    dropped = {name: hit['name'] for name, hit in resolved.items()
               if hit and not hit['analyzable']}
    if dropped:
        print(f"Dropped {len(dropped)} non-analyzable matches: {dropped}")
    resolved = {name: hit for name, hit in resolved.items()
                if hit and hit['analyzable']}

    # heard spelling -> canonical name, for rewriting the sentences the model sees
    rewrites = {name.lower(): hit['name'] for name, hit in resolved.items()}

    final_player_object = {}
    for player_object in identified_names:
        heard = player_object['name']
        hit = resolved.get(heard)
        if not hit:
            continue

        final_name = hit['name']
        original_sentence = player_object['sentence']
        sentence = name_cleaning.rewrite_names_in_sentence(original_sentence, rewrites)

        occurrence = {
            "transcript_name": heard,
            "player_id": hit['player_id'],
            "matched_name": final_name,
            "score": int(round(hit['confidence'] * 100)),
            "confidence": hit['confidence'],
            "match_tier": hit['match_tier'],
            # "high" | "probable" | "low" -- the confidence band, which the frontend
            # renders as the match-quality indicator and sorts on
            "status": hit['band'],
            "sentence_index": player_object['sentence_index'],
            "sentence": sentence,
            "original sentence": original_sentence,
            "player_team": hit['team'],
        }

        if final_name in final_player_object:
            final_player_object[final_name]['occurrence_array'].append(occurrence)
            final_player_object[final_name]['mentioned_sentence_indexes'].add(player_object['sentence_index'])
        else:
            final_player_object[final_name] = {
                'occurrence_array': [occurrence],
                'mentioned_sentence_indexes': set([player_object['sentence_index']])
            }

    # the NLI premise has to spell each player the same way the hypothesis does
    analysis_sentences = []
    if raw_sentences is not None:
        analysis_sentences = [
            name_cleaning.rewrite_names_in_sentence(
                sent if isinstance(sent, str) else sent.text.strip(), rewrites
            )
            for sent in raw_sentences
        ]

    return final_player_object, analysis_sentences


# service functions 
def set_up_to_analyze(transcript: str) -> dict:
    identified_names, raw_sentences = process_transcript(podcast_transcript_text=transcript)
    print("Total Identified Names:", len(identified_names))

    final_player_object, analysis_sentences = match_players_to_roster(identified_names, raw_sentences)
    print("Total Unique Players Mentioned:", len(final_player_object))
    print(final_player_object)

    # Convert sets to lists for JSON serialization
    for player in final_player_object.values():
        if isinstance(player.get('mentioned_sentence_indexes'), set):
            player['mentioned_sentence_indexes'] = list(player['mentioned_sentence_indexes'])

    return {
        "final_player_object": final_player_object,
        "stripped_sentences": analysis_sentences
    }

def analyze(transcript: str) -> dict:
    identified_names, raw_sentences = process_transcript(podcast_transcript_text=transcript)
    print("Total Identified Names:", len(identified_names))

    final_player_object, analysis_sentences = match_players_to_roster(identified_names, raw_sentences)
    print("Total Unique Players Mentioned:", len(final_player_object))
    print(final_player_object)

    player_sentiments = nli.analyze_sentiment(final_player_object, analysis_sentences)
    print("Total Players with Sentiment Analysis:", len(player_sentiments))
        
    return player_sentiments


def main():
    # # Transcript section
    # podcastAudioFileName = "rookie_te_breakout_incoming!_top_12_tes_for_fantasy_football_2025.wav"
    # print("getting transcript with faster-whisper...")
    # # transcription_results = transcript.getTranscriptFromAudio(f"../resources/{podcastAudioFileName}")
    # # clean_transcription_results = transcription_results["text"].strip('"').strip()
    # transcription_results = transcript.getFasterTranscriptFromAudio(f"../resources/{podcastAudioFileName}")
    # print(transcription_results)
    
    # TODO: sentiment analysis section
        # what happens if reviews are 1 positive and 1 negative?
        # should be waited based on extremeness of average (100% positive, 50% negative => positive)

        # if only first_name found, and first_name is among previously identified fullel_names, replace first_name with full_name in sentence
    transcipt_file_path = "../resources/transcript-2026.txt"
    identified_names, raw_sentences = process_transcript(transcipt_file_path)
    print("Total Identified Names:", len(identified_names))
    with open("../outputs/identified_names/nli_identified_names.json", "w", encoding="utf-8") as f:
        json.dump(identified_names, f, ensure_ascii=False, indent=2)
    
    final_player_object, analysis_sentences = match_players_to_roster(identified_names, raw_sentences)
    print("Total Unique Players Mentioned:", len(final_player_object))
    # print(final_player_object)

    player_sentiments = nli.analyze_sentiment(final_player_object, analysis_sentences)
    print(player_sentiments)
    print("Total Players with Sentiment Analysis:", len(player_sentiments))
    
    with open("../outputs/only_matches/nli/player_sentiments.json", "w", encoding="utf-8") as f:
        json.dump(player_sentiments, f, ensure_ascii=False, indent=2)
    
    return player_sentiments
        
if __name__ == "__main__":
    main()