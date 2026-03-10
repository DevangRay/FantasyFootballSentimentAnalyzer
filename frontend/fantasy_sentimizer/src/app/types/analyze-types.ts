export interface SentimentScores {
    positive: number;
    negative: number;
    neutral: number;
}

export interface DetailedSentiment {
    text: string;
    scores: SentimentScores;
    best_label: string;
}

export type MatchingStatus =
    typeof MatchingStatusConst[keyof typeof MatchingStatusConst];

export const MatchingStatusConst = {
    perfect: "perfect match",
    imperfect: "best of multiple matches",
} as const;

export interface PlayerSentiment {
    sentiment_consensus: SentimentScores;
    average_label: string;
    most_frequent_label: string;
    detailed_sentiment: DetailedSentiment[];
    status: MatchingStatus;
    transcript_name: string;
    player_id: string;
}

export interface SentimentObject {
    [player: string]: PlayerSentiment
}