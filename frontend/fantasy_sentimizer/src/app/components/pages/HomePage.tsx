"use client";
import { useState } from "react"

import TextUpload from "../TextUpload";
import FileUploadDialog from "../dialogs/FileUploadDialog";
import AnalysisController from "../AnalysisController";

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