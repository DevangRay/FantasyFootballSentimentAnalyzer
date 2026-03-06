"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

// const chartData: { pole: string, value: number }[] = [
//     { "pole": "negative", "value": -3.435480362490604 },
//     { "pole": "neutral", "value": -2.722602732871708 },
//     { "pole": "positive", "value": -1.669828380016904 }
// ]


export function Chart({ chartData }: { chartData: { pole: string, value: number }[] }) {
    const colorMapping: Record<string, string> = {
        "negative": "#ef4444",
        "neutral": "#2563eb",
        "positive": "#22c55e"
    }

    function getDominantColor(data: { pole: string, value: number }[]): string {
        const dominantPole = data.reduce((prev, current) => current.value > prev.value ? current : prev);
        return colorMapping[dominantPole.pole] || colorMapping["neutral"];
    }

    const chartColor: string = getDominantColor(chartData);

    const chartConfig = {
        value: {
            label: "Score",
            color: chartColor,
        },
    } satisfies ChartConfig

    return (
        <ChartContainer
            config={chartConfig}
            className="w-full min-h-[20px] max-h-[300px] [&_.recharts-wrapper]:overflow-visible"
        >
            <RadarChart
                data={chartData}
                margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
            >
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                />
                <PolarGrid className="fill-(--color-value) opacity-20" />
                <PolarAngleAxis dataKey="pole" />
                <Radar
                    dataKey="value"
                    fill="var(--color-value)"
                    fillOpacity={0.5}
                />
            </RadarChart>
        </ChartContainer>
    )
}
