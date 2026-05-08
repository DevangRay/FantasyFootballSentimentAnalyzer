# Fantasy Football Sentimizer

A full-stack web app that runs sentiment analysis on fantasy football podcast transcripts, telling you how the experts really feel about each player — so you can make smarter lineup decisions.

**Live:** [fantasy-football-sentiment-analyzer.vercel.app](https://fantasy-football-sentiment-analyzer.vercel.app)

---

## Overview

Paste in any podcast transcript (or use the built-in example), and the app will:

1. Extract every NFL player name mentioned using spaCy NER
2. Fuzzy-match extracted names to the official NFL roster
3. Run zero-shot sentiment inference on each player mention using a transformer model
4. Stream live progress back to the browser as analysis runs
5. Display interactive cards with per-player sentiment scores, supporting quotes, and visual breakdowns

---

## How the AI Works

The core of the app is a **Natural Language Inference (NLI)** pipeline rather than a classic text-classification model. This makes it zero-shot — no labeled training data required.

### Model

**[cross-encoder/nli-deberta-v3-small](https://huggingface.co/cross-encoder/nli-deberta-v3-small)** — a `sentence-transformers` CrossEncoder fine-tuned for NLI entailment scoring.

For each player mention, the model is given three hypothesis pairs:


Premise:    "Tyreek Hill's hamstring is a concern heading into Week 8..."
```
Hypothesis 1: "[Player] will perform at a high level or positively influence fantasy points."

Hypothesis 2: "[Player] will perform at a low level or negatively impact fantasy points."

Hypothesis 3: "[Player] will perform as average or neutrally impact fantasy points."
```

The label with the highest entailment score wins for that mention. Scores are then averaged across all mentions of the same player to produce a consensus sentiment.

### Why NLI Instead of a Classifier?

Fantasy football commentary is nuanced in ways that generic sentiment models miss. A sentence like *"I'd stay away from Hill this week"* is negative in a fantasy context but would read as neutral or ambiguous to a general-purpose model. By writing domain-specific hypotheses, the NLI approach captures fantasy-relevant meaning without any fine-tuning.

---

## Technical Challenges

### 1. Names Are Hard

Podcasts don't use official names. Hosts say "Jook", "KD", "Hollywood", or "Big D" — none of which match `nfl_roster.json`. Two layers handle this:

- **Nickname normalization** — a hand-built mapping in [name_cleaning.py](backend/utils/name_cleaning.py) replaces aliases before any processing (e.g. `"Jook" → "David Njoku"`). Replacements are applied to both the extracted names *and* the sentence text so the NLI model always sees the canonical name.
- **Fuzzy matching** — after NER, [fuzz.token_set_ratio](backend/analyzer.py) compares each extracted name against the full roster. Exact matches (100%) are taken first; anything ≥ 80% similarity is accepted as a best-guess match. Match quality is surfaced in the result (`"perfect match"` vs `"best of multiple matches"`).

### 2. Inference at Scale

A long transcript can mention 40+ players across hundreds of sentences. Running inference naively — one call per (sentence, label) pair — would be prohibitively slow.

The solution is **flattened batch inference**: all `(text, hypothesis)` pairs for every player and every label are collected into a single list and passed to the CrossEncoder in one call with `batch_size=16`. For a typical transcript that turns 750 potential inference calls into a single batched forward pass, cutting wall-clock time dramatically.

Hard caps (`MAX_PLAYERS=50`, `MAX_SENTENCES_PER_PLAYER=5`) bound the worst case to ~750 samples per run, preventing memory exhaustion on very long transcripts.

### 3. Streaming a Long-Running Job

ML inference can take 30–60 seconds. A blocking HTTP request would time out or leave the user staring at a spinner with no feedback.

The backend exposes a `/analyze_stream` endpoint that uses **Server-Sent Events (SSE)** to yield progress updates at key milestones:

```
data: {"progress": 25, "message": "Identifying players..."}
data: {"progress": 50, "message": "Running sentiment analysis..."}
data: {"progress": 100, "message": "Done", "result": {...}}
```

The frontend reads the response body as a stream, parses each `data:` chunk, and updates a progress bar in real time. An `AbortSignal` lets the user cancel mid-stream, and the backend catches `GeneratorExit` to clean up gracefully.

### 4. Context Windows for Better Inference

Player mentions rarely stand alone — surrounding sentences add critical context. The [context_window.py](backend/utils/context_window.py) utility extracts a ±2 sentence window around each mention, giving the NLI model the surrounding discussion rather than an isolated fragment.

### 5. Model Size vs. Memory Limits

The original prototype used `facebook/bart-large-mnli` (~1.6 GB). Railway's free tier caps container memory at 2 GB, and with Flask overhead that left no headroom. Switching to `cross-encoder/nli-deberta-v3-small` (~180 MB) solved the constraint while maintaining quality on domain-specific text.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Shadcn UI, Recharts |
| Backend | Python, Flask, Flask-CORS, Gunicorn |
| ML / NLP | `sentence-transformers`, `transformers`, `spaCy en_core_web_md`, `FuzzyWuzzy` |
| Model | `cross-encoder/nli-deberta-v3-small` (HuggingFace) |
| Data | ESPN NFL API → cached `nfl_roster.json` |
| Deployment | Vercel (frontend), Railway (backend), Docker |

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
