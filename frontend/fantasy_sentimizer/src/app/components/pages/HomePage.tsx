"use client";
import { useState } from "react"

import TextUpload from "@/app/components/TextUpload";
import FileUploadButton from "@/app/components/FileUploadButton"
import FileUploadDialog from "@/app/components/dialogs/FileUploadDialog";
import AnalysisController from "@/app/components/AnalysisController";
import { Button } from "@/components/ui/button";

export default function HomePage() {
    const [submittedText, setSubmittedText] = useState<string | null>(null);

    async function onDemoClick () {
        try {
            // retrieve transcript.txt from /public
            const response = await fetch("transcript.txt");
            const text = await response.text();
            setSubmittedText(text);
        } catch (e) {
            console.error("Error loading demo transcript: ", e);
        }
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 gap-4">
            {
                !submittedText ?
                    <>
                        {/* Body */}
                        <TextUpload setSubmittedText={setSubmittedText} />

                        <Button 
                            className="max-w-fit mx-auto cursor-pointer"
                            onClick={onDemoClick}
                        >
                            Try a Demo
                        </Button>

                        {/* Footer */}
                        <FileUploadDialog setSubmittedText={setSubmittedText} DialogButton={FileUploadButton}/>
                    </>
                    : <>
                        <AnalysisController submittedText={submittedText} setSubmittedText={setSubmittedText}/>
                    </>
            }
        </div>
    )
}