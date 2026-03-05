# import spacy
# import os

# # Load the model
# nlp = spacy.load("en_core_web_md")

# # Get the model's installation directory
# # print(nlp.meta)
# # model_path = nlp.meta['path']
# # print(f"Model path: {model_path}")

# # Calculate total size
# total_size = 0
# for dirpath, dirnames, filenames in os.walk(model_path):
#     for filename in filenames:
#         filepath = os.path.join(dirpath, filename)
#         total_size += os.path.getsize(filepath)

# print(f"en_core_web_md size: {total_size / (1024**2):.2f} MB")
import spacy
import os

# Load the model
nlp = spacy.load("en_core_web_md")

# Get the model's installation directory - corrected method
model_path = nlp.meta['lang'] + '_' + nlp.meta['name']
print(f"Model name: {model_path}")

# Better way: get actual path
import en_core_web_md
model_path = os.path.dirname(en_core_web_md.__file__)
print(f"Model path: {model_path}")

# Calculate total size
total_size = 0
for dirpath, dirnames, filenames in os.walk(model_path):
    for filename in filenames:
        filepath = os.path.join(dirpath, filename)
        total_size += os.path.getsize(filepath)

print(f"en_core_web_md size: {total_size / (1024**2):.2f} MB")

# Also print what's in meta for reference
print(f"\nModel metadata:")
for key, value in nlp.meta.items():
    print(f"  {key}: {value}")