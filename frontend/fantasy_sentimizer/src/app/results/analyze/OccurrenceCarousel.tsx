import * as React from "react"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { DetailedSentiment } from "@/app/types/analyze-types";
import { OccurrenceCard } from "@/app/results/analyze/OccurrenceCard";

export function OccurrenceCarousel({ occurrenceArray, player }: { occurrenceArray: DetailedSentiment[], player: string }) {
    return (
        <Carousel
            className="w-full max-w-[45vw] sm:max-w-[60vw] mx-auto px-0 sm:px-8"
            opts={{ loop: true }}
        >
            <CarouselContent>
                {occurrenceArray.map((occurrence, index) => (
                    <CarouselItem key={index}>
                        <OccurrenceCard
                            occurrence={occurrence}
                            player={player}
                            index={index}
                            total={occurrenceArray.length}
                            fixedHeight
                        />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    )
}
