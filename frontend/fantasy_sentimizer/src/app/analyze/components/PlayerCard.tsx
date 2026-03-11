"use client"

import { useState } from "react"

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserRoundCheck, UserRoundCog } from "lucide-react";

import { ImageWithFallback } from "@/app/components/ImageWithBackup";
import { Chart } from "@/app/analyze/components/Chart";
import { MatchingStatus, MatchingStatusConst } from "@/app/types/analyze-types";

export default function PlayerCard({ player, analysisResult }: { player: string, analysisResult: Record<string, any> }) {
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
                            className="flex flex-row items-center gap-4"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-2xl font-bold cursor-default">{player}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            {renderConfidence(analysisResult[player].status, analysisResult[player].transcript_name)} | Transcript Name: {analysisResult[player].transcript_name}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <div
                                className={`transition-all duration-400 ease-out ${isHovered
                                        ? "opacity-100 translate-x-0"
                                        : "opacity-0 -translate-x-5 pointer-events-none"
                                    }`}
                            >
                                {
                                    analysisResult[player].status === MatchingStatusConst.perfect
                                        ? <>
                                            <UserRoundCheck className="text-green-500" />
                                        </>
                                        : <>
                                            <UserRoundCog className="text-yellow-500" />
                                        </>
                                }
                            </div>
                        </div>
                    </CardTitle>

                    {/* <span>{renderConfidence(analysisResult[player].status, analysisResult[player].transcript_name)}</span> */}
                    {/* <CardDescription>Player Matching: {analysisResult[player].status} | Original Name: {analysisResult[player].transcript_name}</CardDescription> */}
                    <CardAction>See more details</CardAction>
                </CardHeader>

                <CardContent>
                    <div className="flex flex-row gap-[5%] pl-[9%] w-full">
                        <div className="w-[35%]">

                            <div className="flex flex-col gap-2 items-center">
                                <ImageWithFallback
                                    src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${analysisResult[player].player_id}.png`}
                                    alt={`${player}'s Profile Photo`}
                                    width={200}
                                    height={200}
                                />
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
                {/* <CardFooter>
                                            <>
                                                <h4>Ratings:</h4>
                                                <h4>Negative {analysisResult[player].sentiment_consensus.negative}</h4>
                                                <h4>Positive {analysisResult[player].sentiment_consensus.positive}</h4>
                                                <h4>Neutral {analysisResult[player].sentiment_consensus.neutral}</h4>
                                            </>
                                        </CardFooter> */}
            </Card>
        </>
    )
}