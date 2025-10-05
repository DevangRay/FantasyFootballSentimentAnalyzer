import os
from dotenv import dotenv_values
from openai import OpenAI

def chunk_audio_by_silence(file_path, max_duration_ms = 20 * 50 * 1000):
    from pydub import AudioSegment, silence
    
    print("Loading audio file")
    audio = AudioSegment.from_file(file_path)
    chunks = silence.split_on_silence(
        audio,
        min_silence_len=700,
        silence_thresh=-40,
        keep_silence=500
    )
    print("Found chunks by silence")
    
    print("Grouping chunks")
    grouped = []
    current_group = AudioSegment.from_file(file_path)
    
    for c in chunks:
        if len(current_group) + len(c) > max_duration_ms:
            grouped.append(current_group)
            current_group = AudioSegment.silent(duration=0)
        current_group += c

    if len(current_group) > 0:
        grouped.append(current_group)
        
    for i, g in enumerate(grouped):
        print("Exporting chunk", i+1, "of", len(grouped))
        g.export(f"../outputs/audio_chunks/chunk_{i+1}.mp3", format="mp3")
    

file_path = "../resources/te_podcast_mp3.mp3"

print("Chunking audio by silence...")

audio_chunks = chunk_audio_by_silence(file_path)
print("Finished chunking audio by silence.")

env_values = dotenv_values(".env")  # load .env file
open_api_key = env_values["OPEN_AI_API_KEY"]  # access variables like a dictionary
print("Loaded OPEN_AI_API_KEY from .env file:", bool(open_api_key))

client = OpenAI(api_key=open_api_key)

directory = "../outputs/audio_chunks"
for found_file in os.listdir(directory):
    file_name = os.fsdecode(found_file)
    if file_name.endswith(".mp3"):
        print("Transcribing chunk:", file_name)
        audio_file= open(os.path.join(directory, file_name), "rb")
        
        transcription = client.audio.transcriptions.create(
            model="gpt-4o-transcribe", 
            file=audio_file,
            prompt="This is a podcast episode discussing NFL football players for the purpose of Fantasy Football.",
        )
        text = transcription.text.strip()
        
        with (open(f"../outputs/transcription/{file_name}_transcription.txt", "a", encoding="utf-8") as f):
            f.write(f"\n--- CHUNK {i} ---\n")
            f.write(text + "\n")

        
# # file can not be more than 25MB without splitting up
# audio_file= open(file_path, "rb")

# transcription = client.audio.transcriptions.create(
#     model="gpt-4o-transcribe", 
#     file=audio_file,
#     prompt="This is a podcast episode discussing NFL football players for the purpose of Fantasy Football.",
# )

# with open("../outputs/transcription/openai_transcription.txt", "w", encoding="utf-8") as f:
#     f.write(transcription.text.strip() + " ");

# print(transcription.text)
        



# def trans/cribeThroughAPi(filename: str) -> dict:
#     # Load your API key from an environment variable or secret management service
#     import os
#     from dotenv import load_dotenv
#     import openai
    
#     env = load_dotenv()
#     print(env.OPEN_AI_API_KEY)
#     # openai.api_key = os.getenv("OPEN_AI_API_KEY")
    
#     # audio_file= open(filename, "rb")

def getFasterTranscriptFromAudio(filename: str) -> dict:
    from faster_whisper import WhisperModel, BatchedInferencePipeline
    from tqdm import tqdm
    import datetime
    
    
    
    print("starting faster-whisper transcription at", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    model_size = "turbo"
    compute_type = "int8"
    model = WhisperModel(model_size, device="cpu", compute_type=compute_type)
    batched_model = BatchedInferencePipeline(model=model)
    
    segments, info = batched_model.transcribe(
        # "../resources/demo_transcription.mp3",
        filename,
        beam_size=5,
        batch_size=8,
        task="transcribe",
        language="en",
        initial_prompt="This is a podcast episode discussing NFL football players for the purpose of Fantasy Football.",
        vad_filter=True,
        word_timestamps=False
    )
    
    print("set up segments at", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    total_duration = info.duration
    progress_bar = tqdm(total=total_duration, desc="Transcribing", unit="sec")
    
    # outputs\transcription\demo_transcript.txt
    with open("../outputs/transcription/faster_whisper_transcription.txt", "w", encoding="utf-8") as f:
        for segment in segments:
            # segment = {id, seek, start, end, text, tokens, avg_logprob, compression_ratio, no_speech_prob, words, temperature}
            # print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
            
            f.write(segment.text.strip() + " ")
            # transcript += segment.text.strip() + " "
            progress_bar.n = min(segment.end, total_duration)
            progress_bar.refresh()
    
    progress_bar.close()
    
    print("finished transcript at", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("written to file")
    
    return {"message": "Transcription complete. See outputs folder for results."}
    

def getTranscriptFromAudio(filename: str) -> dict:
    import whisper
    
    model = whisper.load_model("medium.en")
    result = model.transcribe(
        # "../resources/demo_transcription.mp3",
        filename,
        task="transcribe",
        language="en",
        fp16=False,
        beam_size=5,
        initial_prompt="This is a podcast episode discussing NFL football players for the purpose of Fantasy Football.",
        verbose=False
    )
    
    return result
