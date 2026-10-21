"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import EmptyState from "../components/EmptyState";


export default function ErrorPage() {
    const router = useRouter();
    const [errorText, setErrorText] = useState<string | null>(null);
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const sessionError = sessionStorage.getItem("errorText");
        if (!sessionError) {
            setErrorText("Something went wrong. Please try again.");
        } else {
            setErrorText(sessionError);
            sessionStorage.removeItem("errorText");
        }
    }, []);

    function submit(text: string) {
        sessionStorage.setItem("submittedTranscript", text);
        router.push("/results");
    }

    return (
        <main className="h-screen flex flex-col font-mono">
            <div className="flex-1 flex flex-col min-h-0 gap-4">
                <EmptyState error={errorText} submit={submit}/>
            </div>
        </main>
    )
}