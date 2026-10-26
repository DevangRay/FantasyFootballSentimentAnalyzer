def get_context_window(sentence_index: int, sentences: list[str], window_size: int = 2) -> str:
    """Expand one sentence into a +/- window_size sentence span.

    `sentences` are plain strings with canonical player names already substituted in by
    the matching step, so no name cleaning happens here.
    """
    preceding_context, following_context = [], []
    if sentence_index < window_size:
        preceding_context = sentences[:sentence_index]
    else:
        preceding_context = sentences[sentence_index-window_size:sentence_index]

    if sentence_index + window_size >= len(sentences):
        following_context = sentences[sentence_index:]
    else:
        following_context = sentences[sentence_index:sentence_index+window_size+1]

    context_window = preceding_context + following_context

    return " ".join(sentence.strip() for sentence in context_window).strip()
