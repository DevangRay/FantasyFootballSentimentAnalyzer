# Fantasy Football Sentimizer

A full-stack web app that runs sentiment analysis on fantasy football podcast transcripts, telling you how the experts really feel about each player — so you can make smarter lineup decisions.

**Live:** [fantasy-football-sentiment-analyzer.vercel.app](https://fantasy-football-sentiment-analyzer.vercel.app)

---

## What It Does

Paste in any podcast transcript (or try the built-in demo), and the app will extract every NFL player mentioned, infer the sentiment behind each mention using a transformer model, and render interactive cards with per-player sentiment scores, supporting quotes, and a radar chart breakdown — all while streaming live progress back to the browser as inference runs.

---

## Backend

### Overview

The backend is a Python/Flask API responsible for the full analysis pipeline: parsing raw transcript text, identifying player names, running NLI inference, and streaming results to the client. Python was a natural choice here — the ML ecosystem (PyTorch, Hugging Face Transformers, spaCy, FuzzyWuzzy) is Python-native, and Flask's minimal footprint made it easy to wrap the pipeline in a lightweight streaming API without the overhead of a heavier framework.

The core bet is that a Natural Language Inference (NLI) model,  using fantasy-football-specific hypotheses, can capture fantasy-relevant sentiment without any labeled training data or fine-tuning. A sentence like *"I'd stay away from Hill this week"* reads as neutral to a general-purpose sentiment classifier, but is clearly negative in a fantasy context. By writing hypotheses that describe fantasy performance explicitly, the NLI approach captures that nuance zero-shot.

### API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/analyze_stream` | Full pipeline with SSE progress streaming — main endpoint used by the frontend |
| `POST` | `/analyze` | Synchronous version of the same pipeline (blocking, ~30–60s) |
| `POST` | `/analyze/setup` | Runs only the NER + roster matching steps, skipping inference — useful for pre-validation |
| `GET` | `/nfl/athletes` | Fetches the current NFL roster from the ESPN API and writes `nfl_roster.json` |
| `GET` | `/nfl/athlete/photo/<player_id>` | Returns the ESPN CDN headshot URL for a given player ID |

### The Analysis Pipeline

A transcript goes through three sequential stages before results are returned:

**1. Named Entity Recognition & Name Normalization**

spaCy's `en_core_web_md` model splits the transcript into sentences and extracts `PERSON` entities. Before any NLP runs, a hand-built nickname mapping ([name_cleaning.py](backend/utils/name_cleaning.py)) replaces 57 spoken aliases with their canonical NFL names — both in the extracted entity list and in the sentence text itself. This matters because the NLI model needs to see the same canonical name in the hypothesis and the premise to score accurately. Without this step, mentions of "Jook", "KD", or "Hollywood" would either be missed entirely or scored against the wrong player.

After normalization, a name validator filters out false positives — proper nouns that spaCy tags as `PERSON` but aren't NFL players (e.g., "God", "Taylor Swift", "Rich").

**2. Roster Matching**

Each extracted name is fuzzy-matched against `nfl_roster.json` — a cached snapshot of the full NFL roster fetched from the ESPN API — using FuzzyWuzzy's `token_set_ratio`. Perfect matches (100%) are accepted first; anything above 80% similarity is taken as a best-guess match. The match quality is recorded per-occurrence (`"perfect match"` vs. `"best of multiple matches"`) and surfaced on each player card, giving users a signal on how confident the pipeline was.

The roster also supplies each player's `player_id`, which the frontend uses to construct ESPN CDN headshot URLs.

**3. NLI Sentiment Inference**

This is the expensive step. For each player (capped at 50 per run), up to 5 mention sentences are pulled from the transcript. Each sentence is expanded into a ±2-sentence context window using [context_window.py](backend/utils/context_window.py) — isolated fragments rarely carry enough meaning for accurate inference, and the surrounding discussion is usually where the actual opinion lives.

For each context window, three hypothesis pairs are constructed:

```
Premise:    "Tyreek Hill's hamstring is a concern heading into Week 8..."

Hypothesis 1: "Tyreek Hill will perform at a high level or positively influence fantasy points."
Hypothesis 2: "Tyreek Hill will perform at a low level or negatively impact fantasy points."
Hypothesis 3: "Tyreek Hill will perform as average or neutrally impact fantasy points."
```

Rather than running these pairs one at a time, all `(context, hypothesis)` pairs across every player, mention, and label are **flattened into a single list** and passed to the CrossEncoder in one batched call (`batch_size=16`). For a typical transcript this turns ~600 potential inference calls into a single forward pass — cutting wall-clock time from several minutes to ~30–60 seconds.

The model returns an entailment score for each pair. The highest-scoring label wins per mention; scores are then averaged across all of a player's mentions to produce a consensus sentiment. The result object includes both the average label and the most-frequent label, so edge cases where a player has mixed coverage are visible.

**Model:** `cross-encoder/nli-deberta-v3-small` (~180 MB), a sentence-transformers CrossEncoder fine-tuned for NLI entailment. The original prototype used `facebook/bart-large-mnli` (~1.6 GB), but Railway's 2 GB container limit left no headroom alongside Flask. Switching to the smaller DeBERTa variant solved the memory constraint with minimal quality loss on domain-specific text.

### Streaming

ML inference taking 30–60 seconds would time out a standard HTTP request and leave users with no feedback. The `/analyze_stream` endpoint uses **Server-Sent Events (SSE)** to yield progress updates at key milestones as the pipeline runs:

```
data: {"progress": 10, "message": "Processing transcript..."}
data: {"progress": 25, "message": "Identifying players..."}
data: {"progress": 50, "message": "Running sentiment analysis..."}
data: {"progress": 90, "message": "Aggregating results..."}
data: {"progress": 100, "message": "Done", "result": {...}}
```

Flask's `stream_with_context` keeps the request context alive across the generator, and the backend catches `GeneratorExit` to clean up if the client disconnects mid-stream.

---

## Frontend

### Overview

The frontend is a Next.js app in TypeScript. Its two jobs are: walking the user through transcript input in a way that doesn't expose the complexity of the external transcription step, and rendering the sentiment results in a form that's actually useful for making a lineup decision, not just a list of scores.

Next.js was chosen for its file-based routing (the input wizard and results page are naturally separate routes), built-in image optimization (used for ESPN headshots), and straightforward environment variable injection for the backend URL. ShadCN UI provides accessible, unstyled-by-default components that don't fight Tailwind, and Recharts handles the radar chart visualization.

### User Flow

The app is structured as a three-stage input wizard followed by a results page:

**Stage 1 — Entry point**

Two paths: "Try Demo" (loads a pre-loaded transcript from `/public/transcript.txt` and goes straight to analysis) or "Use My Own Podcast" (advances the wizard).

**Stage 2 — Transcript source**

"Upload a transcript" opens a file picker (`.txt` files, max 1 MB); the file is read as text via `FileReader` and stored. "I have a YouTube link" opens `youtubetotranscript.com` in a new tab and advances the wizard — since transcription itself is too expensive to run in-app, users are pointed to an external tool. See [Limitations](#limitations) for more on this tradeoff.

**Stage 3 — Paste & submit**

Users paste the transcript text, hit Analyze, and the app stores the text in `sessionStorage` and navigates to `/results`. SessionStorage (rather than URL params or a global store) keeps the transcript within the tab without exposing it in the URL or requiring a state management layer across the route boundary.

### Streaming & Progress

The results page retrieves the transcript from `sessionStorage` on mount and immediately calls `performAnalysisStream()` — the SSE client in [sentiment_analysis_api.ts](frontend/fantasy_sentimizer/src/app/api/sentiment_analysis_api.ts). The client reads the response body as a stream, buffers incomplete chunks, splits on `\n\n` to reconstruct SSE frames, and fires two callbacks:

- `onEventRecieved(progress, message)` — updates the progress bar and status message on each interim event
- `onComplete(result)` — receives the full result payload when `progress === 100`

An `AbortController` is created on mount and its signal is passed to `fetch`. The cleanup function returned from the `useEffect` aborts the request if the user navigates away before analysis completes.

### Results Display

Each player gets a **PlayerCard** with four elements:

1. **Header** — Player name and a match-quality indicator (green checkmark for perfect roster match, yellow gear for fuzzy match)
2. **Avatar** — ESPN CDN headshot loaded via a custom `ImageWithBackup` component that falls back to a placeholder if the player ID doesn't resolve to an image
3. **Consensus badge** — The overall sentiment label (`positive`, `negative`, `neutral`, or `convoluted`), color-coded green / red / blue / yellow
4. **Radar chart** — A Recharts `RadarChart` with three axes (positive, negative, neutral) showing the average entailment scores. Scores are on a log scale internally, so chart values are inverted (`1 / Math.abs(score)`) to make higher-confidence predictions visually larger

Alongside the card, individual mention snippets are shown in an **Embla Carousel** (up to 5 per player), each with the context text and its per-mention sentiment label. The player's name is bolded in each snippet via a regex-based `HighlightPlayer` component.

On desktop, clicking a player opens a sticky sidebar panel showing all their mentions. On mobile, the same content renders in a bottom-sheet drawer. Both surfaces share state managed in `AnalysisController.tsx`, which owns all result and UI state as local `useState` — there's no global store; the component tree is shallow enough that prop passing is sufficient.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS 4, Shadcn UI, Recharts, Embla Carousel |
| Backend | Python, Flask 3.1, Flask-CORS, Gunicorn |
| ML / NLP | `sentence-transformers`, `transformers`, `spaCy en_core_web_md`, FuzzyWuzzy |
| Model | `cross-encoder/nli-deberta-v3-small` (Hugging Face) |
| Data | ESPN NFL API → cached `nfl_roster.json` |
| Deployment | Vercel (frontend), Railway (backend), Docker |

---

## CI / Automation

Two GitHub Actions workflows keep the roster data fresh without any manual intervention.

**[post-deploy.yml](.github/workflows/post-deploy.yml)** — Triggers automatically whenever a Railway deployment succeeds. Railway rebuilds the backend container from the Docker image on every push, which resets `nfl_roster.json` to whatever was baked in at build time. This workflow calls `/nfl/athletes` immediately after a successful deploy to repopulate the roster from the ESPN API before any real users hit the app. The steps also hit `/nfl/roster/meta` before and after the refresh, so the run log shows the file's last-modified timestamp on both sides — a lightweight sanity check that the refresh actually happened.

**[refresh-nfl-roster.yml](.github/workflows/refresh-nfl-roster.yml)** — Runs on a weekly cron every Wednesday at midnight UTC, plus a manual dispatch trigger for ad-hoc refreshes. NFL rosters change throughout the season — trades, injuries, waiver pickups — so the cached roster needs regular updates to stay accurate. Wednesday was chosen because that's typically when the weekly transaction window settles after Monday and Tuesday moves, right before the main fantasy decision period (Thursday–Sunday). A stale roster means recently acquired or dropped players get missed or mismatched, which directly degrades analysis quality.

---

## Running Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_md
python app.py
```

### Frontend

```bash
cd frontend/fantasy_sentimizer
npm install
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000 npm run dev
```

---

## Limitations

The app requires a text transcript as input rather than a YouTube URL or audio file. Transcription would add another 30–60 seconds to an already-long pipeline and is resource-intensive — especially when accurate proper-noun capture is critical, since missed or garbled player names directly degrade the NER and sentiment steps. For now, users are directed to an external transcription tool before returning to the app.

With more infrastructure, the natural next step would be integrating OpenAI's Whisper to handle transcription in-app and pipe the output directly into the existing analysis pipeline.
