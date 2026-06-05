"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnalysisController from "@/app/results/AnalysisController";


export default function ResultsPage() {
    const router = useRouter();
    const [transcriptText, setTranscriptText] = useState<string | null>(null);

    useEffect(() => {
        const storedTranscript = sessionStorage.getItem("submittedTranscript");
        if (!storedTranscript) {
            router.replace("/");
            return;
        }

        setTranscriptText(storedTranscript);
    }, []);

    if (!transcriptText) return null;

    return (
        <main className="h-screen flex flex-col font-mono">
            <div className="flex-1 flex flex-col min-h-0 gap-4">
                <AnalysisController transcriptText={transcriptText} />
            </div>
        </main>
    )
}