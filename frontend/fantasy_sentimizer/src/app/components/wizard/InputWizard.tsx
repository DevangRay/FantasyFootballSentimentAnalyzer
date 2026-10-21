"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Play, Mic, Upload, Link, ChevronLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import InputButton from "@/app/components/wizard/InputButton";
import WizardProgress from "@/app/components/wizard/WizardProgress";
import FileUploadDialog from "@/app/components/dialogs/FileUploadDialog";
import { Stage } from "@/app/types/wizard-types";

// Stage 1
const DEMO_BLOB_A = "bg-[radial-gradient(ellipse_at_top_left,_oklch(0.75_0.18_50)_0%,_transparent_60%)]";
const DEMO_BLOB_B = "bg-[radial-gradient(ellipse_at_bottom_right,_oklch(0.7_0.15_280)_0%,_transparent_60%)]";
const PODCAST_BLOB_A = "bg-[radial-gradient(ellipse_at_top_left,_oklch(0.7_0.15_240)_0%,_transparent_60%)]";
const PODCAST_BLOB_B = "bg-[radial-gradient(ellipse_at_bottom_right,_oklch(0.75_0.15_180)_0%,_transparent_60%)]";

// Stage 2
const UPLOAD_BLOB_A = "bg-[radial-gradient(ellipse_at_top_left,_oklch(0.75_0.15_160)_0%,_transparent_60%)]";
const UPLOAD_BLOB_B = "bg-[radial-gradient(ellipse_at_bottom_right,_oklch(0.7_0.12_220)_0%,_transparent_60%)]";
const URL_BLOB_A = "bg-[radial-gradient(ellipse_at_top_left,_oklch(0.75_0.18_25)_0%,_transparent_60%)]";
const URL_BLOB_B = "bg-[radial-gradient(ellipse_at_bottom_right,_oklch(0.7_0.18_255)_0%,_transparent_60%)]";



const STAGE_HEADERS: Record<Stage, { title: string; subtitle: string }> = {
    1: {
        title: "Get started",
        subtitle: "Try the app instantly or bring your own podcast to analyze",
    },
    2: {
        title: "Provide your podcast",
        subtitle: "Upload a transcript you already have, or generate one from a YouTube link",
    },
    3: {
        title: "Paste your transcript",
        subtitle: "Copy the transcript from the site we opened and paste it below",
    },
};

const WizardFileUploadButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
    return (
        <InputButton
            text="Upload a transcript"
            description="Upload a .txt transcript file you already have saved"
            icon={Upload}
            blobA={UPLOAD_BLOB_A}
            blobB={UPLOAD_BLOB_B}
            ref={ref}
            {...props}
            className={className}
        />
    )
}
);

export default function InputWizard() {
    const [stage, setStage] = useState<Stage>(1);
    const [visibleDots, setVisibleDots] = useState<number>(1);
    const [transcriptText, setTranscriptText] = useState<string>("");
    const [fetchingDemo, setFetchingDemo] = useState<boolean>(false);
    const router = useRouter();

    function submit(text: string) {
        sessionStorage.setItem("submittedTranscript", text);
        router.push("/results");
    }

    async function onDemoClick() {
        try {
            setFetchingDemo(true);
            const response = await fetch("transcript.txt");
            const text = await response.text();
            submit(text);
        } catch (e) {
            console.error("Error loading demo transcript: ", e);
            setFetchingDemo(false);
        }
    }

    function goToStage2() {
        setStage(2);
        setVisibleDots((prev) => Math.max(prev, 2));
    }

    function handleYouTubeLink() {
        window.open("https://youtubetotranscript.com/", "_blank");
        setStage(3);
        setVisibleDots((prev) => Math.max(prev, 3));
    }

    const { title, subtitle } = STAGE_HEADERS[stage];

    return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-black/8 bg-white shadow-lg p-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-row items-center justify-between">
                        <WizardProgress visibleDots={visibleDots} currentStage={stage} setStage={setStage} />
                        {stage > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-muted-foreground cursor-pointer"
                                onClick={() => setStage((stage - 1) as Stage)}
                            >
                                <ChevronLeft className="size-4" />
                                Back
                            </Button>
                        )}
                    </div>
                    <div className="text-center flex flex-col gap-2">
                        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    </div>
                </div>

                {/* Stage 1: Demo vs Own Podcast */}
                {stage === 1 && (
                    <div className="flex flex-row gap-6">
                        <InputButton
                            text="Try the Demo"
                            description="Instantly analyze a pre-loaded fantasy football podcast.  No setup needed!"
                            icon={Play}
                            blobA={DEMO_BLOB_A}
                            blobB={DEMO_BLOB_B}
                            loading={fetchingDemo}
                            disabled={fetchingDemo}
                            onClick={() => { onDemoClick() }}
                        />
                        <InputButton
                            text="Use my own podcast"
                            description="Provide a transcript from your own fantasy football podcast"
                            icon={Mic}
                            blobA={PODCAST_BLOB_A}
                            blobB={PODCAST_BLOB_B}
                            disabled={fetchingDemo}
                            onClick={goToStage2}
                        />
                    </div>
                )}

                {/* Stage 2: Upload File vs YouTube Link */}
                {stage === 2 && (
                    <div className="flex flex-row gap-6">
                        <FileUploadDialog onSubmit={submit} DialogButton={WizardFileUploadButton} />
                        <InputButton
                            text="I have a YouTube link"
                            description="We'll open a transcription site in a new tab — come back here once your transcript is ready"
                            icon={Link}
                            blobA={URL_BLOB_A}
                            blobB={URL_BLOB_B}
                            isExternal
                            onClick={handleYouTubeLink}
                        />
                    </div>
                )}

                {/* Stage 3: Paste Transcript */}
                {stage === 3 && (
                    <div className="flex flex-col gap-4">
                        <textarea
                            value={transcriptText}
                            onChange={(e) => setTranscriptText(e.target.value)}
                            placeholder="Paste your transcript here..."
                            rows={10}
                            className="w-full rounded-xl border border-black/10 bg-muted/30 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground"
                        />
                        <div className="flex justify-end">
                            <Button
                                disabled={!transcriptText.trim()}
                                className="gap-2 cursor-pointer"
                                onClick={() => { submit(transcriptText) }}
                            >
                                Analyze
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}