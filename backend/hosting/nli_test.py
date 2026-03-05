from sentence_transformers import CrossEncoder
import os

model = CrossEncoder('cross-encoder/nli-deberta-v3-base')

# The model is typically cached in ~/.cache/huggingface or similar
# You can check the size manually or use:
cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
print(f"Check this directory: {cache_dir}")