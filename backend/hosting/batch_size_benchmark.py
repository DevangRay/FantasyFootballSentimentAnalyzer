"""
Benchmarks model.predict() throughput and peak memory across a range of
batch_size values, using a real transcript run through the production
pipeline (process_transcript -> match_players_to_roster -> context windows)
so the measured pairs match production text-length distribution instead of
synthetic placeholder text.

Run from anywhere - paths are resolved relative to this file's location:
    python hosting/batch_size_benchmark.py

Edit BATCH_SIZES_TO_TEST / WARMUP_RUNS / TIMED_RUNS below to trade off sweep
coverage against total runtime.
"""
import os
import sys
import time
import threading
import statistics as stats
from pathlib import Path

import psutil

SCRIPT_DIR = Path(__file__).resolve().parent              # backend/hosting
BACKEND_ROOT = SCRIPT_DIR.parent                           # backend/
TRANSCRIPT_PATH = BACKEND_ROOT.parent / "resources" / "transcript.txt"

sys.path.insert(0, str(BACKEND_ROOT))
os.chdir(BACKEND_ROOT)  # analyzer.match_players_to_roster() opens "./resources/nfl_roster.json" relative to cwd

import analyzer as sentiment_analyzer                      # noqa: E402
import utils.context_window as context_window              # noqa: E402
from sentiment_analysis.nli_deberta_v3_base import model   # noqa: E402  (reuse the already-loaded singleton)

CANDIDATE_LABELS = ["positive", "negative", "neutral"]
BATCH_SIZES_TO_TEST = [4, 8, 16, 32, 64, 128]
WARMUP_RUNS = 1   # discarded - first call pays one-time JIT/thread-pool warmup costs
TIMED_RUNS = 2    # averaged for the reported time/throughput
MEM_SAMPLE_INTERVAL_SEC = 0.05


def make_hypotheses(player, label):
    # Mirrors sentiment_analysis/nli_deberta_v3_base.py's make_hypotheses()
    if label == "positive":
        return f"{player} will perform at a high level or positively influence fantasy points."
    elif label == "negative":
        return f"{player} will perform at a low level or negatively impact fantasy points."
    else:
        return f"{player} will perform as average or neutrally impact fantasy points."


def build_realistic_pairs():
    """Runs the real transcript through the real pipeline so benchmark pairs
    match production text-length distribution instead of synthetic placeholders."""
    identified_names, raw_sentences = sentiment_analyzer.process_transcript(
        podcast_transcript_filepath=str(TRANSCRIPT_PATH)
    )
    final_player_object, analysis_sentences = sentiment_analyzer.match_players_to_roster(
        identified_names, raw_sentences
    )

    pairs = []
    for player in final_player_object:
        for sentence_index in final_player_object[player]["mentioned_sentence_indexes"]:
            text = context_window.get_context_window(sentence_index, analysis_sentences, window_size=2)
            for label in CANDIDATE_LABELS:
                pairs.append((text, make_hypotheses(player, label)))

    print(f"Built {len(pairs)} pairs from {len(final_player_object)} players "
          f"across {len(raw_sentences)} sentences\n")
    return pairs


class PeakMemSampler:
    """Polls RSS on a background thread so we catch the in-flight peak during
    model.predict(), not just whatever the allocator happens to show afterward."""

    def __init__(self, interval=MEM_SAMPLE_INTERVAL_SEC):
        self.interval = interval
        self.peak_mb = 0.0
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._poll, daemon=True)
        self._proc = psutil.Process(os.getpid())

    def _poll(self):
        while not self._stop.is_set():
            self.peak_mb = max(self.peak_mb, self._proc.memory_info().rss / (1024 ** 2))
            time.sleep(self.interval)

    def __enter__(self):
        self._thread.start()
        return self

    def __exit__(self, *exc_info):
        self._stop.set()
        self._thread.join()


def benchmark_batch_size(pairs, batch_size):
    durations = []
    peak_mb = 0.0

    for run in range(WARMUP_RUNS + TIMED_RUNS):
        sampler = PeakMemSampler()
        start = time.perf_counter()
        with sampler:
            model.predict(pairs, batch_size=batch_size, show_progress_bar=False)
        elapsed = time.perf_counter() - start

        peak_mb = max(peak_mb, sampler.peak_mb)
        if run >= WARMUP_RUNS:
            durations.append(elapsed)

    avg_time = stats.mean(durations)
    throughput = len(pairs) / avg_time
    return avg_time, throughput, peak_mb


def main():
    pairs = build_realistic_pairs()
    if not pairs:
        print("No (text, hypothesis) pairs were built - check that "
              f"{TRANSCRIPT_PATH} and backend/resources/nfl_roster.json are reachable.")
        return

    baseline_mb = psutil.Process(os.getpid()).memory_info().rss / (1024 ** 2)
    print(f"Baseline RSS before any predict() call: {baseline_mb:.1f} MB")
    print("(includes spaCy + the DeBERTa model already loaded at import time)\n")

    print(f"{'batch_size':>10} | {'avg time (s)':>12} | {'pairs/sec':>10} | {'peak RSS (MB)':>13}")
    print("-" * 56)

    results = []
    for batch_size in BATCH_SIZES_TO_TEST:
        avg_time, throughput, peak_mb = benchmark_batch_size(pairs, batch_size)
        results.append((batch_size, avg_time, throughput, peak_mb))
        print(f"{batch_size:>10} | {avg_time:>12.2f} | {throughput:>10.1f} | {peak_mb:>13.1f}")

    best = max(results, key=lambda r: r[2])
    print(f"\nHighest throughput: batch_size={best[0]} "
          f"({best[2]:.1f} pairs/sec, peak RSS {best[3]:.1f} MB)")
    print("Pick the smallest batch_size whose throughput lands within ~5-10% of "
          "the best one above - that's the real 'knee' of the curve, and it keeps "
          "memory headroom for everything else sharing the container.")


if __name__ == "__main__":
    main()
