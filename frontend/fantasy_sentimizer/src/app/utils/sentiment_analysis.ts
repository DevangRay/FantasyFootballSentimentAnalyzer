// sentiment-analysis.ts
import { pipeline, ZeroShotClassificationPipeline } from '@xenova/transformers';

// Types
interface OccurrenceArray {
    status: string;
    transcript_name: string;
}

interface PlayerData {
    mentioned_sentence_indexes: number[];
    occurrence_array: OccurrenceArray[];
}

interface FinalPlayerObject {
    [player: string]: PlayerData;
}

interface SentimentScores {
    positive: number;
    negative: number;
    neutral: number;
}

interface DetailedSentiment {
    text: string;
    scores: SentimentScores;
    best_label: string;
}

interface PlayerSentiment {
    sentiment_consensus: SentimentScores;
    average_label: string;
    most_frequent_label: string;
    detailed_sentiment: DetailedSentiment[];
    status: string;
    transcript_name: string;
}

interface SentimentObject {
    [player: string]: PlayerSentiment;
}

// Initialize the model (do this once, ideally at module level or in a singleton)
let classifier: ZeroShotClassificationPipeline | null = null;

async function initModel(): Promise<ZeroShotClassificationPipeline> {
    if (!classifier) {
        // Using zero-shot classification as an alternative to CrossEncoder
        classifier = await pipeline('zero-shot-classification',
            'Xenova/distilbert-base-uncased-mnli'
        ) as ZeroShotClassificationPipeline;
    }
    return classifier;
}

function getContextWindow(
    sentenceIndex: number,
    rawSentences: string[],
    windowSize: number = 2
): string {
    const start = Math.max(0, sentenceIndex - windowSize);
    const end = Math.min(rawSentences.length, sentenceIndex + windowSize + 1);
    return rawSentences.slice(start, end).join(' ');
}

function makeHypotheses(player: string, label: string): string {
    if (label === "positive") {
        return `${player} will perform at a high level or positively influence fantasy points.`;
    } else if (label === "negative") {
        return `${player} will perform at a low level or negatively impact fantasy points.`;
    } else {
        return `${player} will perform as average or neutrally impact fantasy points.`;
    }
}

function mostFrequent(arr: string[]): string {
    const frequency: Record<string, number> = {};
    let maxCount = 0;
    let mostFrequentItem = arr[0];

    for (const item of arr) {
        frequency[item] = (frequency[item] || 0) + 1;
        if (frequency[item] > maxCount) {
            maxCount = frequency[item];
            mostFrequentItem = item;
        }
    }

    return mostFrequentItem;
}

export async function analyzeSentiment(
    finalPlayerObject: FinalPlayerObject,
    rawSentences: string[]
): Promise<SentimentObject> {
    const model = await initModel();
    const sentimentObject: SentimentObject = {};
    const candidateLabels = ["positive", "negative", "neutral"] as const;

    console.log("Starting analysis, retrieved model")

    for (const player in finalPlayerObject) {
        const playerData = finalPlayerObject[player];
        const playerTexts: string[] = [];

        console.log("setting up player context for player, ", player)
        // Gather all text contexts for this player
        for (const sentenceIndex of playerData.mentioned_sentence_indexes) {
            const sentenceWithContext = getContextWindow(
                sentenceIndex,
                rawSentences,
                2
            );
            playerTexts.push(sentenceWithContext);
        }

        const results: DetailedSentiment[] = [];

        // Process each text context
        for (const text of playerTexts) {
            console.log("making hypotheses")
            // Create hypothesis for zero-shot classification
            const hypotheses = candidateLabels.map(label =>
                makeHypotheses(player, label)
            );

            console.log("getting model output")
            // Run classification
            const output = await model(text, hypotheses, {
                multi_label: false
            });

            // Handle both single output and array output
            const result = Array.isArray(output) ? output[0] : output;

            // Convert output to scores object
            const scores: SentimentScores = {
                positive: 0,
                negative: 0,
                neutral: 0
            };

            candidateLabels.forEach((label) => {
                const labelIndex = result.labels.indexOf(makeHypotheses(player, label));
                scores[label] = labelIndex !== -1 ? result.scores[labelIndex] : 0;
            });

            // Find best label
            const bestLabel = (Object.entries(scores) as [string, number][])
                .reduce((a, b) => a[1] > b[1] ? a : b)[0];

            results.push({
                text,
                scores,
                best_label: bestLabel
            });
        }

        // Calculate average scores
        const scoresMatrix = results.map(r =>
            candidateLabels.map(label => r.scores[label])
        );

        const averageScores: SentimentScores = {
            positive: 0,
            negative: 0,
            neutral: 0
        };

        candidateLabels.forEach((label, idx) => {
            const sum = scoresMatrix.reduce((acc, scores) => acc + scores[idx], 0);
            averageScores[label] = sum / scoresMatrix.length;
        });

        // Find average label
        const averageLabel = (Object.entries(averageScores) as [string, number][])
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];

        // Find most frequent label
        const labelArray = results.map(r => r.best_label);
        const mostFrequentLabel = mostFrequent(labelArray);

        sentimentObject[player] = {
            sentiment_consensus: averageScores,
            average_label: averageLabel,
            most_frequent_label: mostFrequentLabel,
            detailed_sentiment: results,
            status: playerData.occurrence_array[0].status,
            transcript_name: playerData.occurrence_array[0].transcript_name
        };
    }

    return sentimentObject;
}

// Example usage in a Next.js API route:
// app/api/analyze-sentiment/route.ts (App Router)
/*
import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment } from '@/lib/sentiment-analysis';

export async function POST(request: NextRequest) {
  try {
    const { finalPlayerObject, rawSentences } = await request.json();
    const result = await analyzeSentiment(finalPlayerObject, rawSentences);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
*/

// OR for Pages Router:
// pages/api/analyze-sentiment.ts
/*
import type { NextApiRequest, NextApiResponse } from 'next';
import { analyzeSentiment } from '@/lib/sentiment-analysis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  const { finalPlayerObject, rawSentences } = req.body;
  
  try {
    const result = await analyzeSentiment(finalPlayerObject, rawSentences);
    res.status(200).json(result);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
}
*/