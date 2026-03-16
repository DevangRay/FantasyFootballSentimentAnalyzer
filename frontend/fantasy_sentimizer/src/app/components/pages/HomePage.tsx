"use client";
import { useState } from "react"

import TextUpload from "@/app/components/TextUpload";
import FileUploadDialog from "@/app/components/dialogs/FileUploadDialog";
import AnalysisController from "@/app/components/AnalysisController";
import { Button } from "@/components/ui/button";

export default function HomePage() {
    const [submittedText, setSubmittedText] = useState<string | null>(null);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {
                !submittedText ?
                    <>
                        {/* Body */}
                        <TextUpload setSubmittedText={setSubmittedText} />

                        {/* Footer */}
                        <FileUploadDialog setSubmittedText={setSubmittedText} />
                    </>
                    : <>
                        <AnalysisController submittedText={submittedText} />
                    </>
            }
        </div>
    )
}