# from transformers import pipeline

# classifier = pipeline("zero-shot-classification",
#                       model="facebook/bart-large-mnli")

# # """
# # NO NAME. JUST TEXT
# # """
# # # text = "Dak Prescott might be a bust this year."
# # # text = [
# # # "Like, dude, Brock Bowers is again all the targets.",
# # # "So, Brock Bower, he was tight end one last year, but on points per game basis, George KD was tight end one.",
# # # "So Brock Bowers one, George KD two, Trey McBride three.",
# # # "I went Brock B Trey McBride McBride then KD same as last year's um finish.",
# # # "Brock Bowers goes off the board at 17.",
# # # "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go.",
# # # "instead of taking Brock Bowowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George KD.",
# # # "Obviously, uh you have Brock Bower is number one target.",
# # # "And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player."
# # # ]
# # text = "I think Justin Jefferson is a top 3 wide receiver, but Kirk Cousins limits his ceiling."
# # candidate_labels = ["praise", "criticism", "neutral"]

# # result = classifier(text, candidate_labels)
# # print(result)

# """
# PROVIDING NAME
# """
# # text = "I think Justin Jefferson is a top 3 wide receiver, but Kirk Cousins limits his ceiling."
# text = [
# "Like, dude, Brock Bowers is again all the targets.",
# "So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one.",
# "So Brock Bowers one, George Kittle two, Trey McBride three.",
# "I went Brock Bowers, Trey McBride, then George Kittle same as last year's um finish.",
# "Brock Bowers goes off the board at 17.",
# "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock Bowers. I wait for Brock Bowers to go.",
# "instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle.",
# "Obviously, uh you have Brock Bowers is number one target.",
# "And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player."
# ]
# player = "Brock Bowers"
# labels = ["praise", "criticism", "neutral"]

# inputs = [f"Sentiment toward {player}: {t}" for t in text]

# results = classifier(inputs, candidate_labels=labels)
# # print(result)

# for window, result in zip(text, results):
#     print("TEXT:", window)
#     print("LABEL:", result["labels"][0], "SCORE:", result["scores"][0])
#     print()


from sentence_transformers import CrossEncoder
import numpy as np

model = CrossEncoder('cross-encoder/nli-deberta-v3-base')

player = "Brock Bowers"
texts = [
    "Like, dude, Brock Bowers is getting all the targets.",
    "So, Brock Bowers, he was tight end one last year, but on points per game basis, George Kittle was tight end one.",
    "So Brock Bowers one, George Kittle two, Trey McBride three.",
    "I went Brock Bowers, Trey McBride, then George Kittle same as last year's um finish.",
    "Brock Bowers goes off the board at 17.",
    "Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock Bowers. I wait for Brock Bowers to go.",
    "instead of taking Brock Bowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George Kittle.",
    "Obviously, uh you have Brock Bowers is number one target.",
    "And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player.",
]

labels = ["positive", "negative", "neutral"]

# def make_hypotheses(player, label):
#     return f"The sentiment toward {player} is {label}."
def make_hypotheses(player, label):
    if label == "positive":
        return f"{player} will perform at a high level and positively influence fantasy points."
    elif label == "negative":
        return f"{player} will underperform or negatively impact fantasy points."
    else:
        return f"{player} will have an average or neutral impact."



results = []
for text in texts:
    pairs = [(text, make_hypotheses(player, label)) for label in labels]
    scores = model.predict(pairs) # shape: (3, 3)
    # {'contradiction': 0, 'entailment': 1, 'neutral': 2}
    entailment_col_index = model.config.label2id['entailment']
    entailment_scores = scores[:, entailment_col_index] # shape: (3,)
    best_idx = int(np.argmax(entailment_scores))
    results.append({
        "text": text,
        "scores": {label: float(score) for label, score in zip(labels, entailment_scores)},
        # "scores": dict(zip(labels, entailment_scores)),
        "best_label": labels[best_idx]
    })
    
scores_matrix = np.array([list(result["scores"].values()) for result in results])
average_scores = scores_matrix.mean(axis=0)
final_label = labels[np.argmax(average_scores)]

print("Per-window results:")
for result in results:
    print(result)
    
print("\nFinal aggregated sentiment towards", player, "is :", final_label)
print("With average scores:", dict(zip(labels, average_scores)))