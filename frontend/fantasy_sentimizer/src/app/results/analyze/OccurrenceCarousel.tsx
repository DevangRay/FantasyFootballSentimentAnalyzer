import * as React from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { DetailedSentiment } from "@/app/types/analyze-types";
import HighlightWord from "@/app/results/analyze/HighlightPlayer";

const labelColorMap: Record<string, { text: string; bg: string }> = {
    positive: { text: "#22c55e", bg: "#dcfce7" },
    negative: { text: "#ef4444", bg: "#fee2e2" },
    neutral: { text: "#2563eb", bg: "#dbeafe" },
}

export function OccurrenceCarousel({ occurrenceArray, player }: { occurrenceArray: DetailedSentiment[], player: string }) {
    return (
        <Carousel
            className="w-full max-w-[45vw] sm:max-w-[60vw] mx-auto px-0 sm:px-8"
            opts={{ loop: true }}
        >
            <CarouselContent>
                {occurrenceArray.map((occurrence, index) => {
                    const colors = labelColorMap[occurrence.best_label] ?? { text: "#60646b", bg: "#f3f4f6" };
                    return (
                        <CarouselItem key={index}>
                            <Card className="w-full">
                                <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
                                    <span className="text-xs text-muted-foreground">
                                        Mention {index + 1} of {occurrenceArray.length}
                                    </span>
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                                        style={{ color: colors.text, backgroundColor: colors.bg }}
                                    >
                                        {occurrence.best_label}
                                    </span>
                                </CardHeader>
                                <CardContent className="h-[140px] overflow-y-auto px-4 py-3">
                                    <p className="text-sm leading-relaxed">
                                        <HighlightWord text={occurrence.text} wordToBold={player} />
                                    </p>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    );
                })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    )
}
