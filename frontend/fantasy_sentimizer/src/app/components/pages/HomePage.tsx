"use client";
import { useState } from "react"

import AnalysisController from "@/app/components/AnalysisController";
import InputWizard from "@/app/components/wizard/InputWizard";

export default function HomePage() {
    const [submittedText, setSubmittedText] = useState<string | null>(null);

    return (
        <div className="flex-1 flex flex-col min-h-0 gap-4">
            {
                !submittedText ?
                    <InputWizard setSubmittedText={setSubmittedText} />
                    : <AnalysisController submittedText={submittedText} setSubmittedText={setSubmittedText} />
            }
        </div>
    )
}
