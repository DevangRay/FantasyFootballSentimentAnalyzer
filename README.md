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

The core bet is that a Natural Language Inference (NLI) model, using fantasy-football-specific hypotheses, can capture fantasy-relevant sentiment without any labeled training data or fine-tuning. A sentence like *"I'd stay away from Hill this week"* reads as neutral to a general-purpose sentiment classifier, but is clearly negative in a fantasy context. By writing hypotheses that describe fantasy performance explicitly, the NLI approach captures that nuance zero-shot.

### API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/analyze_stream` | Full pipeline with SSE progress streaming — main endpoint used by the frontend |
| `POST` | `/analyze` | Synchronous version of the same pipeline (blocking, ~30–60s) |
| `POST` | `/analyze/setup` | Runs only the NER + roster matching steps, skipping inference — useful for pre-validation |
| `GET` | `/nfl/athletes` | Fetches the current NFL roster from the ESPN API and writes `nfl_roster.json` |
| `GET` | `/nfl/roster/meta` | Returns the cached roster's player count and last-modified timestamp — used as a CI sanity check |
| `GET` | `/nfl/athlete/photo/<player_id>` | Returns the ESPN CDN headshot URL for a given player ID |

### The Analysis Pipeline

A transcript goes through three sequential stages before results are returned. The numbers quoted below come from running the bundled demo transcript (`resources/transcript-2026.txt`) end to end.

**1. Named Entity Recognition & Name Normalization**

spaCy's `en_core_web_md` model splits the transcript into sentences and extracts `PERSON` entities (1,277 sentences and 287 name mentions for the demo transcript). A hand-built nickname mapping ([name_cleaning.py](backend/utils/name_cleaning.py)) then replaces 79 spoken aliases (collapsing to 39 canonical players) in both the extracted entity list and the sentence text itself. This matters because the NLI model needs to see the same canonical name in the hypothesis and the premise to score accurately. Without this step, mentions of "Jook", "KD", or "CMC" would either be missed entirely or scored against the wrong player.

Most of those aliases are transcription artifacts rather than real nicknames — automated transcription mangles proper nouns badly, so "Sam LaPorta" arrives as "leaporta", "sam laora", "sam lapoora", and several other spellings, all of which map back to one player.

After normalization, a name validator filters out false positives — proper nouns that spaCy tags as `PERSON` but aren't NFL players (e.g., "God", "Taylor Swift", "Rich").

**2. Roster Matching**

Each extracted name is fuzzy-matched against `nfl_roster.json`, a cached snapshot of the full NFL roster fetched from the ESPN API (~6,900 players), using FuzzyWuzzy's `token_set_ratio`. The top 5 candidates are pulled; perfect matches (100%) are preferred, and if there are none, anything above 80% similarity is taken as a best-guess match. The match quality is recorded per-occurrence (`"perfect match"` vs. `"best of multiple matches"`) and surfaced on each player card, giving users a signal on how confident the pipeline was. The demo transcript's 287 mentions collapse to 83 unique matched players.

The roster also supplies each player's `player_id`, which the frontend uses to construct ESPN CDN headshot URLs.

**3. NLI Sentiment Inference**

This is the expensive step, so it is bounded on both axes: players are sorted by mention count and the top `MAX_PLAYERS = 20` are kept, and each of those contributes at most `MAX_SENTENCES_PER_PLAYER = 20` mention sentences. Each sentence is expanded into a ±2-sentence context window using [context_window.py](backend/utils/context_window.py) — isolated fragments rarely carry enough meaning for accurate inference, and the surrounding discussion is usually where the actual opinion lives.

For each context window, three hypothesis pairs are constructed:

```
Premise:    "Tyreek Hill's hamstring is a concern heading into Week 8..."

Hypothesis 1: "Tyreek Hill will perform at a high level or positively influence fantasy points."
Hypothesis 2: "Tyreek Hill will perform at a low level or negatively impact fantasy points."
Hypothesis 3: "Tyreek Hill will perform as average or neutrally impact fantasy points."
```

Rather than running these pairs one at a time, all `(context, hypothesis)` pairs across every player, mention, and label are **flattened into a single list** and passed to the CrossEncoder in one batched call (`batch_size=16`). For a typical transcript this turns ~600 potential inference calls into a single forward pass — cutting wall-clock time from several minutes to ~30–60 seconds.

The model returns a raw entailment logit for each pair. The highest-scoring label wins per mention; scores are then averaged across all of a player's mentions to produce a consensus sentiment. The result object includes both the average label and the most-frequent label, so edge cases where a player has mixed coverage are visible.

**Model:** `cross-encoder/nli-deberta-v3-small` (~180 MB), a sentence-transformers CrossEncoder fine-tuned for NLI entailment. The original prototype used `facebook/bart-large-mnli` (~1.6 GB), but Railway's 2 GB container limit left no headroom alongside Flask. Switching to the smaller DeBERTa variant solved the memory constraint with minimal quality loss on domain-specific text.

### Streaming

ML inference taking 30–60 seconds would time out a standard HTTP request and leave users with no feedback. The `/analyze_stream` endpoint uses **Server-Sent Events (SSE)** to yield progress updates as the pipeline runs — three stage milestones, then one event per player as inference completes. This shows an example of what will be returned to the client, although the player name will change based on greedy chunking:

```
data: {"progress": 10, "message": "Processing transcript..."}
data: {"progress": 25, "message": "Identifying NFL players..."}
data: {"progress": 50, "message": "Running sentiment analysis..."}
data: {"progress": 52, "message": "Analyzing Brock Bowers (1/20)..."}
...
data: {"progress": 98, "message": "Analyzing Kyle Pitts Sr. (20/20)..."}
data: {"progress": 100, "message": "Complete", "result": {...}}
```

Per-player events are mapped onto the 50–98% band, so the bar advances continuously through the long inference stage rather than jumping between coarse milestones.

Flask's `stream_with_context` keeps the request context alive across the generator, and the backend catches `GeneratorExit` to clean up if the client disconnects mid-stream. In production Gunicorn runs with `--worker-class gthread --workers 1 --threads 2 --timeout 600`, since a 30–60s streamed response would be killed by the default 30s worker timeout.

---

## Frontend

### Overview

The frontend is a Next.js app in TypeScript. Its two jobs are: walking the user through transcript input in a way that doesn't expose the complexity of the external transcription step, and rendering the sentiment results in a form that's actually useful for making a lineup decision, not just a list of scores.

Next.js was chosen for its file-based routing (the input wizard and results page are naturally separate routes), built-in image optimization (ESPN's CDN is allowlisted in `next.config.ts` and headshots render through `next/image`), and straightforward environment variable injection for the backend URL. ShadCN UI provides accessible, unstyled-by-default components that don't fight Tailwind, and Recharts handles the radar chart visualization.

### User Flow

The app is structured as a three-stage input wizard (`/`) followed by a results page (`/results`):

**Stage 1 — Entry point**

Two paths: "Try Demo" (loads a pre-loaded transcript from `/public/transcript.txt` and goes straight to analysis) or "Use My Own Podcast" (advances the wizard).

**Stage 2 — Transcript source**

"Upload a transcript" opens a drag-and-drop dialog backed by react-dropzone (single `.txt` file, max 1 MB); the file is read as text via `FileReader` and submitted. "I have a YouTube link" opens `youtubetotranscript.com` in a new tab and advances the wizard — since transcription itself is too expensive to run in-app, users are pointed to an external tool. See [Limitations](#limitations) for more on this tradeoff.

**Stage 3 — Paste & submit**

Users paste the transcript text, hit Analyze, and the app stores the text in `sessionStorage` and navigates to `/results`. SessionStorage (rather than URL params or a global store) keeps the transcript within the tab without exposing it in the URL or requiring a state management layer across the route boundary. `/results` redirects back to `/` if it finds nothing in storage, so the route can't be deep-linked into an empty state.

### Streaming & Progress

The results page retrieves the transcript from `sessionStorage` on mount and immediately calls `performAnalysisStream()` — the SSE client in [sentiment_analysis_api.ts](frontend/fantasy_sentimizer/src/app/api/sentiment_analysis_api.ts). The client reads the response body as a stream, buffers incomplete chunks, splits on `\n\n` to reconstruct SSE frames, and fires two callbacks:

- `onEventRecieved(progress, message)` — updates the progress bar and status message on each interim event
- `onComplete(result)` — receives the full result payload when `progress === 100`

An `AbortController` is created on mount and its signal is passed to `fetch`. The cleanup function returned from the `useEffect` aborts the request if the user navigates away before analysis completes.

### Results Display

Players are sorted by match quality first (perfect matches above fuzzy ones), then by mention count, so the most trustworthy and most-discussed players surface at the top. Each gets a **PlayerCard** with four elements:

1. **Header** — Player name and a match-quality indicator (green `UserRoundCheck` for a perfect roster match, yellow `UserRoundCog` for a fuzzy one); hovering reveals the raw name as it appeared in the transcript
2. **Avatar** — ESPN CDN headshot loaded via a custom `ImageWithFallback` component that swaps in a placeholder if the player ID doesn't resolve to an image
3. **Consensus badge** — The overall sentiment label, color-coded green / red / blue. When the average label and the most-frequent label disagree, the card reports `convoluted` (yellow) rather than picking a winner, and shows both labels underneath
4. **Radar chart** — A Recharts `RadarChart` with three axes (positive, negative, neutral). The model emits raw entailment logits, which for this task land in the negative range, so chart values are inverted (`1 / Math.abs(score)`) to turn the least-negative — i.e. strongest — label into the largest spoke

A toggle at the top of the results page switches how mentions are displayed. In sidebar mode (the default), each card gets an "Occurrences" button that opens a sticky side panel on desktop or a bottom-sheet drawer on mobile, listing every mention for that player. In carousel mode, the mentions render inline in an **Embla Carousel** in each card's footer. Both surfaces show the context text with its per-mention sentiment label, and bold the player's name via a regex-based `HighlightPlayer` component.

State is managed in `AnalysisController.tsx`, which owns all result and UI state as local `useState` — there's no global store; the component tree is shallow enough that prop passing is sufficient.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS 4, Shadcn UI, Recharts, Embla Carousel |
| Backend | Python 3.11, Flask 3.1, Flask-CORS, Gunicorn |
| ML / NLP | PyTorch (CPU build), `sentence-transformers`, `transformers`, `spaCy en_core_web_md`, FuzzyWuzzy |
| Model | `cross-encoder/nli-deberta-v3-small` (Hugging Face) |
| Data | ESPN NFL API → cached `nfl_roster.json` |
| Deployment | Vercel (frontend), Railway (backend), Docker |

---

## CI / Automation

Two GitHub Actions workflows keep the roster data fresh without any manual intervention.

**[post-deploy.yml](.github/workflows/post-deploy.yml)** — Triggers on a successful `deployment_status` event. Railway rebuilds the backend container from the Docker image on every push, which resets `nfl_roster.json` to whatever was baked in at build time. This workflow calls `/nfl/athletes` immediately after a successful deploy to repopulate the roster from the ESPN API before any real users hit the app. The steps also hit `/nfl/roster/meta` before and after the refresh, so the run log shows the file's last-modified timestamp on both sides — a lightweight sanity check that the refresh actually happened.

**[refresh-nfl-roster.yml](.github/workflows/refresh-nfl-roster.yml)** — Runs on a weekly cron every Wednesday at midnight UTC, plus a manual dispatch trigger for ad-hoc refreshes. NFL rosters change throughout the season — trades, injuries, waiver pickups — so the cached roster needs regular updates to stay accurate. Wednesday was chosen because that's typically when the weekly transaction window settles after Monday and Tuesday moves, right before the main fantasy decision period (Thursday–Sunday). A stale roster means recently acquired or dropped players get missed or mismatched, which directly degrades analysis quality.

---

## Running Locally

### Backend

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_md
python app.py                                     # serves on http://localhost:5000
```

The first run downloads the DeBERTa checkpoint (~541 MB) from Hugging Face and caches it locally.

### Frontend

```bash
cd frontend/fantasy_sentimizer
npm install
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:5000" > .env.local
npm run dev
```

`NEXT_PUBLIC_BACKEND_URL` falls back to `http://localhost:5000` when unset, so `.env.local` is only strictly needed when pointing at a deployed backend.

### Benchmarking

[batch_size_benchmark.py](backend/hosting/batch_size_benchmark.py) sweeps `model.predict()` throughput and peak RSS across batch sizes, building its pairs by running a real transcript through the real pipeline so the measured text-length distribution matches production:

```bash
cd backend
python hosting/batch_size_benchmark.py
```

---

## Limitations

The app requires a text transcript as input rather than a YouTube URL or audio file. Transcription would add another 30–60 seconds to an already-long pipeline and is resource-intensive — especially when accurate proper-noun capture is critical, since missed or garbled player names directly degrade the NER and sentiment steps. For now, users are directed to an external transcription tool before returning to the app.

With more infrastructure, the natural next step would be integrating OpenAI's Whisper to handle transcription in-app and pipe the output directly into the existing analysis pipeline.
