export interface SentimentScores {
    positive: number;
    negative: number;
    neutral: number;
}

export interface DetailedSentiment {
    text: string;
    scores: SentimentScores;
    best_label: string;
    /** the name as it was actually spoken in this stretch of the transcript */
    transcript_name?: string;
    /** which rule attributed this sentence to the player: "full", "surname", "phonetic", ... */
    match_tier?: string;
    match_confidence?: number;
    match_status?: MatchingStatus;
}

export type MatchingStatus =
    typeof MatchingStatusConst[keyof typeof MatchingStatusConst];

export const MatchingStatusConst = {
    high: "high",
    probable: "probable",
    low: "low",
} as const;

export interface PlayerSentiment {
    sentiment_consensus: SentimentScores;
    average_label: string;
    most_frequent_label: string;
    detailed_sentiment: DetailedSentiment[];
    /** band of the strongest mention anywhere in the transcript */
    status: MatchingStatus;
    match_tier?: string;
    match_confidence?: number;
    transcript_name: string;
    player_id: string;
    player_team?: string;
}

export interface SentimentObject {
    [player: string]: PlayerSentiment
}

/** Display metadata per band, shared by the card header and the occurrence cards. */
export const matchStatusDisplay: Record<MatchingStatus, { label: string; text: string; bg: string }> = {
    high: { label: "Strong match", text: "#16a34a", bg: "#dcfce7" },
    probable: { label: "Probable match", text: "#ca8a04", bg: "#fef9c3" },
    low: { label: "Weak match", text: "#ea580c", bg: "#ffedd5" },
};

/** Plain-English gloss for how the name was matched, for a tooltip or caption. */
export const matchTierDescription: Record<string, string> = {
    "full": "matched on first and last name",
    "full-concat": "matched on the whole name run together",
    "surname": "matched on surname alone",
    "surname-part": "matched on part of a compound surname",
    "firstname": "matched on first name alone",
    "initialism": "matched as an initialism",
    "first+initial": "matched on first name plus surname initial",
    "manual-alias": "matched from a known nickname",
};

export function describeMatchTier(tier?: string): string | null {
    if (!tier) return null;
    return matchTierDescription[tier] ?? `matched by ${tier}`;
}
