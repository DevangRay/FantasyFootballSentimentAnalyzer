"use client"

import { useState } from "react"

import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { AlignRight, UserRoundCheck, UserRoundCog } from "lucide-react";

import { ImageWithFallback } from "@/app/results/analyze/ImageWithBackup";
import { Chart } from "@/app/results/analyze/Chart";
import { OccurrenceCarousel } from "@/app/results/analyze/OccurrenceCarousel";
import { MatchingStatus, MatchingStatusConst } from "@/app/types/analyze-types";

export default function PlayerCard({ player, analysisResult, showSidebar, onOpenDrawer }: { player: string, analysisResult: Record<string, any>, showSidebar: boolean, onOpenDrawer?: () => void }) {
    const [isHovered, setIsHovered] = useState(false);

    function renderConfidence(matchingStatus: MatchingStatus, originalName: string) {
        if (matchingStatus === MatchingStatusConst.perfect) {
            return <span className="text-green-500 font-bold">Perfect Match</span>
        }
        else if (matchingStatus === MatchingStatusConst.imperfect) {
            return <span className="text-yellow-500 font-bold">Partial Match (Original Name: {originalName})</span>
        }
    }

    function renderConsensus(average_label: string, mode_label: string): string {
        return (average_label === mode_label ? average_label : "convoluted");
    }

    const consensusColorMap: Record<string, string> = {
        "positive": "#22c55e",
        "negative": "#ef4444",
        "neutral": "#2563eb",
        "convoluted": "#f2c04b"
    }

    const consensusColor: string = consensusColorMap[renderConsensus(analysisResult[player].average_label, analysisResult[player].most_frequent_label)] ?? '#60646b';

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>
                        <div
                            className="flex flex-col relative"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <div className="flex flex-row items-center sm:gap-4">
                                <span className="text-2xl font-bold cursor-default">{player}</span>
                                {
                                    analysisResult[player].status === MatchingStatusConst.perfect
                                        ? <UserRoundCheck className="text-green-500" />
                                        : <UserRoundCog className="text-yellow-500" />
                                }
                            </div>

                            <div
                                className={`absolute top-full left-0 transition-all duration-400 ease-out 
                                    ${isHovered
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 -translate-y-5 pointer-events-none"
                                    }`}
                            >
                                <p className="text-sm font-normal text-muted-foreground">
                                    {renderConfidence(analysisResult[player].status, analysisResult[player].transcript_name)} | Transcript Name: {analysisResult[player].transcript_name}
                                </p>
                            </div>
                        </div>
                    </CardTitle>

                    {showSidebar && (
                        <CardAction>
                            <Button onClick={onOpenDrawer} variant="outline" size="sm" className="cursor-pointer">
                                <AlignRight className="w-4 h-4 mr-1" /> Occurrences
                            </Button>
                        </CardAction>
                    )}
                </CardHeader>

                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4 sm:pl-[9%] w-full">
                        <div className="w-full sm:w-[35%] flex flex-col items-center">
                            <div className="flex flex-col gap-2 items-center">
                                <div className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]">
                                    <ImageWithFallback
                                        src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${analysisResult[player].player_id}.png`}
                                        alt={`${player}'s Profile Photo`}
                                        fill
                                        sizes="(max-width: 640px) 160px, 200px"
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Critic Consensus</p>
                                    <p
                                        className="text-2xl font-bold capitalize"
                                        style={{ color: consensusColor }}
                                    >
                                        {renderConsensus(analysisResult[player].average_label, analysisResult[player].most_frequent_label)}
                                    </p>
                                </div>
                                <div className="flex flex-row gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                                        Avg: <span
                                            className="font-medium text-foreground capitalize"
                                            style={{ color: consensusColorMap[analysisResult[player].average_label] }}
                                        >{analysisResult[player].average_label}</span>
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                                        Mode: <span
                                            className="font-medium text-foreground capitalize"
                                            style={{ color: consensusColorMap[analysisResult[player].most_frequent_label] }}
                                        >{analysisResult[player].most_frequent_label}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Chart
                            chartData={Object.entries(analysisResult[player].sentiment_consensus).map(
                                ([pole, value]) => ({ pole, value: (1 / Math.abs(value as number)) })
                            )}
                            chartColor={consensusColor}
                        />
                    </div>
                </CardContent>
                {
                    !showSidebar && (
                        <CardFooter className="flex flex-col">
                            <OccurrenceCarousel
                                occurrenceArray={analysisResult[player].detailed_sentiment}
                                player={player}
                            />
                        </CardFooter>
                    )
                }
            </Card>
        </>
    )
}