import * as React from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import HighlightWord from "@/app/results/analyze/HighlightPlayer";
import {
    DetailedSentiment,
    matchStatusDisplay,
    describeMatchTier,
} from "@/app/types/analyze-types";

const labelColorMap: Record<string, { text: string; bg: string }> = {
    positive: { text: "#22c55e", bg: "#dcfce7" },
    negative: { text: "#ef4444", bg: "#fee2e2" },
    neutral: { text: "#2563eb", bg: "#dbeafe" },
}

/**
 * One mention: the quoted context, its sentiment, and why this sentence was attributed
 * to this player. The attribution matters because it varies between mentions of the same
 * player -- the hosts might say "Brock Bowers" once and "Bowowers" later, and only the
 * second one is a guess worth checking.
 */
export function OccurrenceCard({
    occurrence,
    player,
    index,
    total,
    fixedHeight = false,
}: {
    occurrence: DetailedSentiment;
    player: string;
    index: number;
    total?: number;
    /** the carousel needs every slide the same height; the scrolling lists do not */
    fixedHeight?: boolean;
}) {
    const colors = labelColorMap[occurrence.best_label] ?? { text: "#60646b", bg: "#f3f4f6" };
    const match = occurrence.match_status ? matchStatusDisplay[occurrence.match_status] : null;
    const tier = describeMatchTier(occurrence.match_tier);

    // Only worth calling out when the hosts said something other than the player's name.
    const heardDifferently =
        occurrence.transcript_name &&
        occurrence.transcript_name.toLowerCase() !== player.toLowerCase();

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
                <span className="text-xs text-muted-foreground">
                    {total ? `Mention ${index + 1} of ${total}` : `Mention ${index + 1}`}
                </span>
                <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                    style={{ color: colors.text, backgroundColor: colors.bg }}
                >
                    {occurrence.best_label}
                </span>
            </CardHeader>

            <CardContent
                className={`px-4 py-3 ${fixedHeight ? "h-[140px] overflow-y-auto" : ""}`}
            >
                <p className="text-sm leading-relaxed">
                    <HighlightWord text={occurrence.text} wordToBold={player} />
                </p>
            </CardContent>

            {(match || tier) && (
                <CardFooter className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 pt-0 pb-3">
                    {match && (
                        <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ color: match.text, backgroundColor: match.bg }}
                            title={
                                occurrence.match_confidence != null
                                    ? `confidence ${Math.round(occurrence.match_confidence * 100)}%`
                                    : undefined
                            }
                        >
                            {match.label}
                        </span>
                    )}
                    {heardDifferently && (
                        <span className="text-[11px] text-muted-foreground">
                            heard as &ldquo;{occurrence.transcript_name}&rdquo;
                        </span>
                    )}
                    {tier && (
                        <span className="text-[11px] text-muted-foreground">
                            {heardDifferently ? "· " : ""}{tier}
                        </span>
                    )}
                </CardFooter>
            )}
        </Card>
    )
}
