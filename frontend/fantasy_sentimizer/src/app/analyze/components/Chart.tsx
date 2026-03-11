"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"


export function Chart({ chartData, chartColor }: { chartData: { pole: string; value: number; }[]; chartColor: string }) {
    const chartConfig = {
        value: {
            label: "Score",
            color: chartColor,
        },
    } satisfies ChartConfig

    return (
        // <ChartContainer
        //     config={chartConfig}
        //     className="w-[60%] min-h-[20px] max-h-[400px] [&_.recharts-wrapper]:overflow-visible"
        // >
        //     <RadarChart
        //         data={chartData}
        //         margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        //     >
        <ChartContainer
            config={chartConfig}
            className="w-[60%] min-h-[20px] max-h-[300px] [&_.recharts-wrapper]:overflow-visible [&_.recharts-wrapper]:!w-full [&_.recharts-surface]:!w-full"
        >
            <RadarChart
                data={chartData}
                width={undefined}
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
