import utils.name_cleaning as name_cleaning

def get_context_window(sentence_index: int, sentences: list[str], window_size: int = 2) -> str:
    preceding_context = []
    if sentence_index < window_size:
        preceding_context = sentences[:sentence_index]
    else:
        preceding_context = sentences[sentence_index-window_size:sentence_index]
    
    following_context = []
    if sentence_index + window_size >= len(sentences):
        following_context = sentences[sentence_index:]
    else:
        following_context = sentences[sentence_index:sentence_index+window_size+1]
        
    context_window = preceding_context + following_context
    
    full_context = ""
    for sent in context_window:
        clean_sentence = name_cleaning.replace_nickname_in_sentence(sent.text.strip())
        full_context += clean_sentence + " "
    
    return full_context.strip()