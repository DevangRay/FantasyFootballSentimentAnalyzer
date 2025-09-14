from transformers import pipeline

classifier = pipeline("zero-shot-classification",
                      model="facebook/bart-large-mnli")

# text = "Dak Prescott might be a bust this year."
text = [
"Like, dude, Brock Bowers is again all the targets.",
"So, Brock Bower, he was tight end one last year, but on points per game basis, George KD was tight end one.",
"So Brock Bowers one, George KD two, Trey McBride three.",
"I went Brock B Trey McBride McBride then KD same as last year's um finish.",
"Brock Bowers goes off the board at 17.",
"Every reddraft league I've done so far, every best ball draft I've done, I let everybody jump on Brock I wait for Brock Bowers to go.",
"instead of taking Brock Bowowers and, you know, missing out on that elite other running back or top tier receiver, I'm like, dude, I'm just gonna get George KD.",
"Obviously, uh you have Brock Bower is number one target.",
"And I think I forgot I had to move I have to I have to go back in and move Brock Bowers down because when I don't it automatically moves him to my number one overall player."
]
candidate_labels = ["praise", "criticism", "neutral"]

result = classifier(text, candidate_labels)
print(result)