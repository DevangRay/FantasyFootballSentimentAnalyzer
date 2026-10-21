import { cn } from "@/lib/utils";
import "@/app/components/wizard/styling/WizardProgress.css";
import React from "react";
import { WizardProgressProps, Stage } from "@/app/types/wizard-types";

const LABELS = ["Get started", "Provide your podcast", "Paste your transcript"];

function ProgressDot({ stageNum, currentStage, onClick, label }: { stageNum: number; currentStage: number; onClick?: () => void; label: string }) {
    const isActive = stageNum === currentStage;
    const isCompleted = stageNum < currentStage;

    return (
        <div className="relative group/dot">
            <div
                onClick={onClick}
                className={cn(
                    "size-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-110",
                    isActive && "bg-foreground ring-2 ring-foreground/20 ring-offset-2",
                    isCompleted && "bg-foreground/40",
                    !isActive && !isCompleted && "bg-border"
                )}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none flex flex-col items-center opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150">
                <div className="bg-foreground text-background text-xs px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                    {label}
                </div>
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-foreground" />
            </div>
        </div>
    );
}

function AnimatedSegment({ stageNum, currentStage, setStage, lineActive }: { stageNum: number; currentStage: number; setStage: React.Dispatch<React.SetStateAction<Stage>>; lineActive: boolean }) {
    return (
        <div className="flex flex-row items-center">
            {/* Line extends left → right */}
            <div
                className={cn(
                    "h-[2px] animate-[wizard-line-extend_0.3s_ease-out_both]",
                    lineActive ? "bg-foreground/30" : "bg-border"
                )}
            />
            {/* Dot appears after line finishes */}
            <div className="animate-[wizard-dot-appear_0.2s_ease-out_0.25s_both]">
                <ProgressDot stageNum={stageNum} currentStage={currentStage} onClick={() => setStage(stageNum as Stage)} label={LABELS[stageNum - 1]} />
            </div>
        </div>
    );
}

export default function WizardProgress({ visibleDots, currentStage, setStage }: WizardProgressProps) {
    return (
        <div className="flex flex-row items-center">
            <ProgressDot stageNum={1} currentStage={currentStage} onClick={() => setStage(1)} label={LABELS[0]} />

            {visibleDots >= 2 && (
                <AnimatedSegment
                    stageNum={2}
                    currentStage={currentStage}
                    setStage={setStage}
                    lineActive={currentStage >= 2}
                />
            )}

            {visibleDots >= 3 && (
                <AnimatedSegment
                    stageNum={3}
                    currentStage={currentStage}
                    setStage={setStage}
                    lineActive={currentStage >= 3}
                />
            )}
        </div>
    );
}
