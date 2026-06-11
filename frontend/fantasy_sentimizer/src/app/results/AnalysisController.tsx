"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { performAnalysisStream } from "@/app/api/sentiment_analysis_api";
import HighlightWord from "@/app/results/analyze/HighlightPlayer";
import PlayerCard from "@/app/results/analyze/PlayerCard";
import { SentimentObject } from "@/app/types/analyze-types";
import { mockCallAPI } from "@/app/utils/test-functions";

const labelColorMap: Record<string, { text: string; bg: string }> = {
    positive: { text: "#22c55e", bg: "#dcfce7" },
    negative: { text: "#ef4444", bg: "#fee2e2" },
    neutral: { text: "#2563eb", bg: "#dbeafe" },
}

export default function AnalysisController({ transcriptText }: { transcriptText: string }) {
    const [loading, setLoading] = useState<boolean>(true);
    const [progress, setProgress] = useState<number>(0);
    const [loadingMessage, setLoadingMessage] = useState<string>("Starting analysis...");
    const [analysisResult, setAnalysisResult] = useState<SentimentObject>({});
    const [error, setError] = useState<string | null>(null);
    const [sortedPlayers, setSortedPlayers] = useState<string[]>([]);
    const [showSidebar, setShowSidebar] = useState<boolean>(true);
    const [openDrawerPlayer, setOpenDrawerPlayer] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        if (analysisResult && Object.keys(analysisResult).length > 0) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        // // DEBUG
        setLoading(true);
        // const players = mockCallAPI();
        // const sortedPlayers = sortPlayersByStatusAndMentions(players);
        // setSortedPlayers(sortedPlayers);
        // setAnalysisResult(players);
        // setLoading(false);

        callAPIStream(controller.signal);

        return () => {
            controller.abort();
        }
    }, [transcriptText]);

    useEffect(() => {
        if (error !== null) {
            renderError(error);
        }
    }, [error]);

    function onSwitchClick() {
        setShowSidebar(!showSidebar);
        setOpenDrawerPlayer(null);
    }

    function sortPlayersByStatusAndMentions(obj: SentimentObject) {
        return Object.keys(obj)
            .sort((a, b) => {
                const statusOrder = {
                    "perfect match": 0,
                    "best of multiple matches": 1
                }

                const statusDiff = statusOrder[obj[a].status] - statusOrder[obj[b].status]
                if (statusDiff !== 0) return statusDiff;

                return obj[b].detailed_sentiment.length - obj[a].detailed_sentiment.length;
            })

    }

    async function callAPIStream(signal: AbortSignal) {
        try {
            setLoading(true);
            setProgress(0);
            setLoadingMessage("Starting analysis...");

            console.log("calling api stream")
            let sortedPlayerResults: string[] = [];
            await performAnalysisStream(
                transcriptText,
                (progress, message) => {
                    setProgress(progress);
                    setLoadingMessage(message);
                },
                (result) => {
                    console.log("streaming complete, moving to sorting");
                    sortedPlayerResults = sortPlayersByStatusAndMentions(result)
                    console.log("sorted Players: ", sortedPlayerResults);

                    setAnalysisResult(result);
                    setSortedPlayers(sortedPlayerResults);
                },
                signal
            );

            if (sortedPlayerResults.length < 1) {
                setError("No players found.");
            }

            setLoading(false);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;
            setError(error instanceof Error ? error.message : "Unknown error");
            console.error("Error calling API: ", error);
            setLoading(false);
        }
    }

    function renderError(errorText: string | null) {
        if (errorText !== null) {
            sessionStorage.setItem("errorText", errorText);
        }
        router.push("/error");
    }


    return (
        <div className="flex-1 flex flex-col min-h-0 mt-4 items-center">
            {
                !loading ?
                    <>
                        <>
                            <div className="flex items-center space-x-2 tem-sm sm:text-base">
                                <Label htmlFor="show-sidebar">
                                    {
                                        showSidebar ? "View Player Occurrences in Sidebar" : "View Player Occurrences as Carousel"
                                    }
                                </Label>
                                <Switch
                                    id="show-sidebar"
                                    checked={showSidebar}
                                    onClick={onSwitchClick}
                                />
                            </div>

                            <div className="w-full flex flex-row items-start justify-between">
                                {/* Card list - full width on mobile, shrinks on desktop when drawer is open */}
                                <div className={[
                                    "transition-all duration-300 flex flex-col gap-6 sm:gap-10 p-4",
                                    "w-full",                                          // mobile: full width
                                    openDrawerPlayer
                                        ? "md:w-[70vw]"                               // desktop: drawer open
                                        : "md:w-[80vw] md:mx-auto"                    // desktop: drawer closed
                                ].join(" ")}>
                                    {sortedPlayers.map((player, index) => (
                                        <PlayerCard
                                            key={index}
                                            player={player}
                                            analysisResult={analysisResult}
                                            showSidebar={showSidebar}
                                            onOpenDrawer={() => setOpenDrawerPlayer(player)}
                                        />
                                    ))}
                                </div>

                                {openDrawerPlayer && (
                                    <div className="hidden md:flex w-[25vw] sticky right-0 top-0 h-screen overflow-y-auto border-l bg-background shadow-xl flex-col transition-all duration-300 z-50">
                                        <div className="flex items-center justify-between px-4 py-3 border-b">
                                            <h3 className="font-semibold text-sm">{openDrawerPlayer} — Occurrences</h3>

                                            <button onClick={() => setOpenDrawerPlayer(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                                        </div>

                                        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">
                                            {analysisResult[openDrawerPlayer].detailed_sentiment.map((occurrence, index) => {
                                                const colors = labelColorMap[occurrence.best_label] ?? { text: "#60646b", bg: "#f3f4f6" };
                                                return (
                                                    <Card key={index}>
                                                        <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
                                                            <span className="text-xs text-muted-foreground">Mention {index + 1}</span>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                                                                style={{ color: colors.text, backgroundColor: colors.bg }}>
                                                                {occurrence.best_label}
                                                            </span>
                                                        </CardHeader>

                                                        <CardContent className="px-4 py-3">
                                                            <p className="text-sm leading-relaxed">
                                                                <HighlightWord text={occurrence.text} wordToBold={openDrawerPlayer} />
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile bottom sheet — only on small screens */}
                            {openDrawerPlayer && (
                                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-2xl rounded-t-2xl max-h-[60vh] flex flex-col">
                                    <div className="flex items-center justify-between px-4 py-3 border-b">
                                        <h3 className="font-semibold text-sm">{openDrawerPlayer} — Occurrences</h3>

                                        <button onClick={() => setOpenDrawerPlayer(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">
                                        <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">
                                            {analysisResult[openDrawerPlayer].detailed_sentiment.map((occurrence, index) => {
                                                const colors = labelColorMap[occurrence.best_label] ?? { text: "#60646b", bg: "#f3f4f6" };
                                                return (
                                                    <Card key={index}>
                                                        <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
                                                            <span className="text-xs text-muted-foreground">Mention {index + 1}</span>
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                                                                style={{ color: colors.text, backgroundColor: colors.bg }}>
                                                                {occurrence.best_label}
                                                            </span>
                                                        </CardHeader>

                                                        <CardContent className="px-4 py-3">
                                                            <p className="text-sm leading-relaxed">
                                                                <HighlightWord text={occurrence.text} wordToBold={openDrawerPlayer} />
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    </>
                    : <>
                        <div className="w-fit sm:w-full max-w-sm flex h-[80vh] flex-col justify-center">
                            <div className="w-full max-w-sm flex flex-col py-4">
                                <div className="flex gap-10 justify-between items-center mb-1">
                                    <div className="flex-1 min-w-0 h-5 overflow-hidden relative" style={{ perspective: '300px' }}>
                                        <span
                                            key={loadingMessage}
                                            className="text-xs text-muted-foreground block animate-message-in"
                                        >
                                            {loadingMessage ? loadingMessage : "No loading message..."}
                                        </span>
                                    </div>

                                    <span className="text-xs text-muted-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        </div>
                    </>
            }
        </div>
    )
}