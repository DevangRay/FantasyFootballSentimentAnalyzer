# Fantasy Football Sentimizer

A full-stack web app that runs sentiment analysis on fantasy football podcast transcripts, telling you how the experts really feel about each player, so you can make smarter lineup decisions.

**Live:** [https://ff-sentimizer.vercel.app](https://ff-sentimizer.vercel.app)

---

## What It Does

Paste in any podcast transcript (or try the built-in demo), and the app will extract every NFL player mentioned, infer the sentiment behind each mention using a transformer model, and render interactive cards with per-player sentiment scores, supporting quotes, and a radar chart breakdown, all while streaming live progress back to the browser as inference runs.

---

## Backend

### Overview

The backend is a Python/Flask API responsible for the full analysis pipeline: parsing raw transcript text, identifying player names, running NLI inference, and streaming results to the client. Python was a natural choice here, the ML ecosystem (PyTorch, Hugging Face Transformers, spaCy, RapidFuzz) is Python-native, and Flask's minimal footprint made it easy to wrap the pipeline in a lightweight streaming API without the overhead of a heavier framework.

The core bet is that a Natural Language Inference (NLI) model, using fantasy-football-specific hypotheses, can capture fantasy-relevant sentiment without any labeled training data or fine-tuning. A sentence like *"I'd stay away from Hill this week"* reads as neutral to a general-purpose sentiment classifier, but is clearly negative in a fantasy context. By writing hypotheses that describe fantasy performance explicitly, the NLI approach captures that nuance zero-shot.

### API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/analyze_stream` | Full pipeline with SSE progress streaming. The only endpoint the frontend calls |
| `POST` | `/analyze/setup` | Runs only the NER + roster matching steps, skipping inference. Useful for pre-validation |
| `GET` | `/nfl/athletes` | Fetches the NFL roster from the ESPN API, joins per-player fantasy ownership, filters to scoreable players, and writes both `nfl_roster.json` and `nfl_non_players.json` (head coaches) |
| `GET` | `/nfl/roster/meta` | Returns the cached roster's player count and last-modified timestamp. Used as a CI sanity check |
| `GET` | `/nfl/athlete/photo/<player_id>` | Returns the ESPN CDN headshot URL for a given player ID |

### The Analysis Pipeline

A transcript goes through three sequential stages before results are returned. The numbers quoted below come from running the bundled demo transcript (`resources/transcript-2026.txt`) end to end.

**1. Named Entity Recognition**

spaCy's `en_core_web_md` model splits the transcript into sentences and extracts `PERSON` entities (1,277 sentences and 287 name mentions for the demo transcript). A name validator then filters out false positives, proper nouns that spaCy tags as `PERSON` but aren't NFL players (e.g., "God", "Taylor Swift", "Rich").

Names are carried forward exactly as heard. Resolving them needs the whole transcript at once, so it happens in the next stage rather than per-sentence.

**2. Name Resolution & Roster Matching**

This is the step that decides whether the rest of the pipeline is analyzing the right player. Podcasters almost never say a name the way the roster spells it: they shorten it ("JSN", "CMC"), use the surname alone ("McCaffrey"), clip it ("Tyler War"), or the transcription mangles it outright ("Sam LaPorta" arrives as "leaporta", "sam laora", "sam lapoora"). The resolver ([player_resolver.py](backend/utils/player_resolver.py)) derives these variants from the roster itself instead of from a per-podcast lookup table, so a transcript from a show it has never seen still resolves. Five mechanisms do the work:

**Relevance pools.** The roster holds ~6,900 players, but a fantasy podcast only plausibly discusses a few hundred. `/nfl/athletes` joins ESPN's fantasy API onto the roster to store `percent_owned` per player, which splits the cache into a *relevant* pool (owned in real fantasy leagues, ~320 players), a *fringe* pool (active at a fantasy position, ~300) and a small tail. Searching the relevant pool first is what makes a bare "McCaffrey" resolve to Christian (99.9% owned) rather than Luke (0.1%) with no hand-written exception, and it collapses the ambiguous-surname problem from 827 colliding surnames across the full roster to 28 within the relevant pool. The long tail is reachable only by a near-complete name, so a bare surname never resolves to someone nobody is discussing.

**Component scoring.** A heard name is scored against each candidate's first name and surname separately rather than as one string. Scoring the concatenation is what makes "Jordan Tyson" collide with Jordan Addison; scoring the halves independently matches Jordyn Tyson on both. A heard component that is a prefix of the real one scores highly regardless of length, which is what separates a deliberate clipping ("war" for Warren) from an unrelated name sharing a few letters.

**Phonetic similarity.** Transcription mangles spelling but usually preserves sound, so Double Metaphone keys recover "leaporta" → LaPorta and "concaid" → Kincaid. Phonetic agreement lifts a spelling score rather than replacing it: short tokens collide acoustically far too easily, and treating a shared metaphone key as proof of identity matches "joker" to Jacory and "pennix" to Bo Nix.

**Who is even eligible.** `/nfl/athletes` caches only players who could appear in a fantasy report: one of `QB RB WR TE PK K FB`, and either active or carrying some fantasy ownership. That cuts 6,989 athletes to 838 and removes a whole class of wrong answer, because defensive players and retired ones were never going to be scored, only mistaken for someone who would be. Ownership deliberately overrides ESPN's `active` flag, which lags reality for injured players: filtering on `active` alone would drop 246 owned players, Davante Adams (92% owned), De'Von Achane and Tyreek Hill among them.

Retired players and coaches are the harder half of the same problem, because they get discussed constantly. A transcript saying "he's the next Antonio Gates" or quoting Saints head coach Kellen Moore has no player to resolve to, and a surname match alone would hand those sentences to Zane Gonzalez or Elijah Moore. So `/nfl/athletes` also fetches the 32 current head coaches into `nfl_non_players.json`, and the resolver scores them, plus the shows' own hosts, as *decoys*: a heard name that fits a decoy better than any player resolves to nothing. Matching decoys rather than blocklisting them is what makes it survive transcription, since what a transcript actually produces is "Kell Moore", not "Kellen Moore". A decoy has to win by a margin, so a surname shared with a coach ("Taylor") still resolves to Jonathan Taylor.

**Transcript context.** Hosts introduce a player in full, then shorten. A first pass finds the players this transcript names unambiguously and in full (56 anchors in the demo transcript); a second pass re-resolves everything with those as a bounded nudge, so a later bare "Tucker" becomes Tucker Kraft rather than Tre Tucker, and "Warren" becomes Tyler Warren rather than Jaylen. The nudge is deliberately too small to override a clear full-name match.

Each match carries a confidence, which is banded into `high` / `probable` / `low` and surfaced per occurrence. Below 0.72 the resolver reports no match rather than guessing, since a wrong match costs more than a miss: it produces a bogus player card *and* consumes one of the inference slots. The demo transcript's 287 mentions collapse to 77 unique matched players, with most occurrences landing in the `high` band.

What survives by hand is a 11-entry alias table in [name_cleaning.py](backend/utils/name_cleaning.py), down from 79. Those are the irreducible cases: nicknames with no phonetic or structural tie to the real name ("joker" for Evan Engram, "KD" for George Kittle), and garbles that sound more like a different real player than like the intended one ("hawinson" scores closer to Jameis Winston than to T.J. Hockenson). [tests/test_name_resolution.py](backend/tests/test_name_resolution.py) keeps the original 79 aliases as a regression fixture and asserts that the derived rules alone still handle the ones that aren't hand-listed; 63 of 68 currently resolve correctly.

Both passes score every candidate in the relevant and fringe pools directly rather than relying on a prefiltering index, which is simpler and more accurate; at ~620 candidates it costs ~1.3s for the demo transcript's 287 mentions, plus a one-time index build per process. That is negligible against the ~67s inference stage.

The roster also supplies each player's `player_id`, which the frontend uses to construct ESPN CDN headshot URLs.

**3. NLI Sentiment Inference**

This is the expensive step, so it is bounded on both axes: players are sorted by mention count and the top `MAX_PLAYERS = 20` are kept, and each of those contributes at most `MAX_SENTENCES_PER_PLAYER = 20` mention sentences. Each sentence is expanded into a ±2-sentence context window using [context_window.py](backend/utils/context_window.py), isolated fragments rarely carry enough meaning for accurate inference, and the surrounding discussion is where the actual opinion lives.

For each context window, three hypothesis pairs are constructed:

```
Premise:    "Tyreek Hill's hamstring is a concern heading into Week 8..."

Hypothesis 1: "Tyreek Hill will perform at a high level or positively influence fantasy points."
Hypothesis 2: "Tyreek Hill will perform at a low level or negatively impact fantasy points."
Hypothesis 3: "Tyreek Hill will perform as average or neutrally impact fantasy points."
```

Rather than running these one pair at a time, players are greedily grouped into chunks whose combined pair count stays near `BATCH_SIZE = 64`, and each chunk is scored in a single `model.predict()` call. The demo transcript produces 624 `(context, hypothesis)` pairs across its 20 scored players; chunking turns that into roughly ten forward passes instead of 624 individual calls, running in ~67s on a local 8-core CPU.

Chunking, rather than flattening every pair into one giant call, is used to support the SSE stream architecture of the `analyze_stream` endpoint. Each player's slice of a chunk is read back out and yielded as soon as its chunk finishes, so the progress bar advances steadily instead of sitting at 50% until all inferences complete.

`torch.set_num_threads(8)` pins intra-op parallelism to the vCPU count provisioned in Railway. The app runs a single Gunicorn worker and isn't expected to serve concurrent requests, so there is no competing call to share cores with, letting every `predict()` split its matmuls across all 8 cores is what actually shortens wall-clock time per request. If concurrent traffic ever becomes real this needs to drop, replaced by worker processes for concurrency; otherwise simultaneous calls would each claim 8 threads and oversubscribe.

The model returns a raw entailment logit for each pair. The highest-scoring label wins per mention; scores are then averaged across all of a player's mentions to produce a consensus sentiment. The result object includes both the average label and the most-frequent label, so edge cases where a player has mixed coverage are visible.

**Model:** `cross-encoder/nli-deberta-v3-small`, a sentence-transformers CrossEncoder fine-tuned for NLI entailment. The original prototype used `facebook/bart-large-mnli` (~1.6 GB checkpoint), which was swapped down the DeBERTa line to fit what was believed to be a 2 GB container ceiling on Railway. That assumption turned out to be wrong twice over: the deployment actually gets 8 vCPU / 8 GB, and the "small" checkpoint is 541 MB on disk with a measured ~460 MB RSS delta at load, not the ~150–180 MB originally estimated. Memory headroom is therefore much looser than the switch assumed, and the base-vs-small tradeoff is worth revisiting if accuracy matters more than raw speed.

### Streaming

ML inference taking 30–60 seconds would time out a standard HTTP request and leave users with no feedback. The `/analyze_stream` endpoint uses **Server-Sent Events (SSE)** to yield progress updates as the pipeline runs three stage milestones, then one event per player as inference completes. This shows an example of what will be returned to the client, although the player name will change based on greedy chunking:

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

**Stage 1: Entry point**

Two paths: "Try the Demo" (fetches the pre-loaded transcript from `/public/transcript-2026.txt` and goes straight to analysis) or "Use my own podcast" (advances the wizard).

**Stage 2: Transcript source**

"Upload a transcript" opens a drag-and-drop dialog backed by react-dropzone (single `.txt` file, max 1 MB); the file is read as text via `FileReader` and submitted. "I have a YouTube link" opens `youtubetotranscript.com` in a new tab and advances the wizard, since transcription itself is too expensive to run in-app, users are pointed to an external tool. See [Limitations](#limitations) for more on this tradeoff.

**Stage 3: Paste & submit**

Users paste the transcript text, hit Analyze, and the app stores the text in `sessionStorage` and navigates to `/results`. SessionStorage (rather than URL params or a global store) keeps the transcript within the tab without exposing it in the URL or requiring a state management layer across the route boundary. `/results` redirects back to `/` if it finds nothing in storage, so the route can't be deep-linked into an empty state.

### Streaming & Progress

The results page retrieves the transcript from `sessionStorage` on mount and immediately calls `performAnalysisStream()`, the SSE client in [sentiment_analysis_api.ts](frontend/fantasy_sentimizer/src/app/api/sentiment_analysis_api.ts). The client reads the response body as a stream, buffers incomplete chunks, splits on `\n\n` to reconstruct SSE frames, and fires two callbacks:

- `onEventRecieved(progress, message)`: updates the progress bar and status message on each interim event
- `onComplete(result)`: receives the full result payload when `progress === 100`

An `AbortController` is created on mount and its signal is passed to `fetch`. The cleanup function returned from the `useEffect` aborts the request if the user navigates away before analysis completes.

### Results Display

Players are sorted by confidence band first (`high`, then `probable`, then `low`), then by mention count, so the most trustworthy and most-discussed players surface at the top. Each gets a **PlayerCard** with four elements:

1. **Header**: Player name and a match-quality indicator, one icon per confidence band (green `UserRoundCheck` for `high`, yellow `UserRoundCog` for `probable`, orange `UserRoundSearch` for `low`); hovering reveals the confidence, how the name was matched, and the raw name as it appeared in the transcript. The band shown is that of the player's *strongest* mention anywhere in the transcript, since one clean full-name mention is what establishes who is being discussed
2. **Avatar**: ESPN CDN headshot loaded via a custom `ImageWithFallback` component that swaps in a placeholder if the player ID doesn't resolve to an image
3. **Consensus badge**: The overall sentiment label, color-coded green / red / blue. When the average label and the most-frequent label disagree, the card reports `convoluted` (yellow) rather than picking a winner, and shows both labels underneath
4. **Radar chart**: A Recharts `RadarChart` with three axes (positive, negative, neutral). The model emits raw entailment logits, which for this task land in the negative range, so chart values are inverted (`1 / Math.abs(score)`) to turn the least-negative (strongest) label into the largest spoke

A toggle at the top of the results page switches how mentions are displayed. In sidebar mode (the default), each card gets an "Occurrences" button that opens a sticky side panel on desktop or a bottom-sheet drawer on mobile, listing every mention for that player. In carousel mode, the mentions render inline in an **Embla Carousel** in each card's footer. Both surfaces render the same `OccurrenceCard`: the context text with the player's name bolded via a regex-based `HighlightPlayer` component, its per-mention sentiment label, and a footer saying how *that particular sentence* was attributed, which band it fell in, and what the hosts actually said if it differed from the player's name.

The per-mention attribution is there because it varies within a single player, and the card-level badge can hide that. Colston Loveland's card reads `high` on the strength of one clean "Loveland", while the eleven "Lovelin" mentions underneath it are each `probable` at 0.78 -- which is the detail you need to judge whether a surprising sentiment score is really about him.

State is managed in `AnalysisController.tsx`, which owns all result and UI state as local `useState`. There's no global store as the component tree is shallow enough that prop passing is sufficient.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS 4, Shadcn UI, Recharts, Embla Carousel |
| Backend | Python 3.11, Flask 3.1, Flask-CORS, Gunicorn |
| ML / NLP | PyTorch (CPU build), `sentence-transformers`, `transformers`, `spaCy en_core_web_md`, RapidFuzz, `metaphone` (Double Metaphone) |
| Model | `cross-encoder/nli-deberta-v3-small` (Hugging Face) |
| Data | ESPN NFL API + ESPN fantasy API (ownership) → cached `nfl_roster.json` |
| Deployment | Vercel (frontend), Railway (backend), Docker |

---

## CI / Automation

Two GitHub Actions workflows keep the roster data fresh without any manual intervention.

**[post-deploy.yml](.github/workflows/post-deploy.yml)**: Triggers on a successful `deployment_status` event. Railway rebuilds the backend container from the Docker image on every push, which resets `nfl_roster.json` to whatever was baked in at build time. This workflow calls `/nfl/athletes` immediately after a successful deploy to repopulate the roster from the ESPN API before any real users hit the app. The steps also hit `/nfl/roster/meta` before and after the refresh, so the run log shows the file's last-modified timestamp on both sides, a lightweight sanity check that the refresh actually happened.

**[refresh-nfl-roster.yml](.github/workflows/refresh-nfl-roster.yml)**: Runs on a weekly cron every Wednesday at midnight UTC, plus a manual dispatch trigger for ad-hoc refreshes. NFL rosters change throughout the season from trades, injuries, waiver pickups, etc. so the cached roster needs regular updates to stay accurate. Wednesday was chosen because that's typically when the weekly transaction window settles after Monday and Tuesday moves, right before the main fantasy decision period (Thursday–Sunday). A stale roster means recently acquired or dropped players get missed or mismatched, which directly degrades analysis quality.

The weekly cadence matters more now that the roster also carries fantasy ownership, since that is what the name resolver uses to decide which of two players sharing a surname a transcript means. Ownership moves every week as leagues add and drop, so a stale snapshot degrades disambiguation as well as coverage.

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

### Name resolution regression test

[tests/test_name_resolution.py](backend/tests/test_name_resolution.py) scores the resolver against the 79 hand-collected aliases it replaced, and fails if the rules derived from the roster stop handling the ones that aren't hand-listed:

```bash
cd backend
python tests/test_name_resolution.py
```

---

## Limitations

The app requires a text transcript as input rather than a YouTube URL or audio file. Transcription would add another 30–60 seconds to an already-long pipeline and is resource-intensive, especially when accurate proper-noun capture is critical, since missed or garbled player names directly degrade the NER and sentiment steps. For now, users are directed to an external transcription tool before returning to the app.

Name resolution is now derived from the roster rather than from a hand-tuned mapping (see [Name Resolution & Roster Matching](#the-analysis-pipeline)), but gaps remain. Eleven aliases are still hand-listed because no rule can reach them, and a new show's in-jokes will need their own entries. Ambiguity between two comparably relevant players sharing a surname is only resolved when the transcript names one of them in full somewhere, so a show that says nothing but "Hill" all episode is still a coin flip weighted by ownership.

The decoy list covers head coaches and this project's known hosts, so it does not cover coordinators, analysts, team owners, or the hosts of a show it has not seen; those still resolve to a player if the name fits one closely enough. Retired players are only excluded by name when they were recent enough for ESPN to still list them, which is why "Jimmy Graham" drops out but "Antonio Gates" is instead rejected for having no plausible surname match at all.

The relevance prior also inherits ESPN's ownership snapshot, which lags reality in both directions: an injured star's ownership collapses even though the hosts still discuss him constantly, and a breakout rookie is invisible until leagues pick him up.

Furthermore, this project does not support analysis of D/ST in fantasy conversations. The extension of the current pipeline would require wider context parsing to account for ways people may talk about defenses and special teams in fantasy situations: the name of the team's city (Detroit has been weak to tight ends throughout the season), the Head Coach or Defensive Coordinator (Aaron Glenn/Brian Flores looking to take advantage of JJ's inexpereince this week), or individual players.

With more infrastructure, the natural next step would be integrating OpenAI's Whisper to handle transcription in-app and pipe the output directly into the existing analysis pipeline.
