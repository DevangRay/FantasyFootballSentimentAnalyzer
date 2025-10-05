"use client";
import { useState } from "react"

import TextUpload from "../TextUpload";
import FileUploadDialog from "../dialogs/FileUploadDialog";

export default function HomePage() {
    const [submittedText, setSubmittedText] = useState<string | null>(null);

    return (
        <>
            {
                !submittedText ?
                    <>
                        {/* Body */}
                        <TextUpload setSubmittedText={setSubmittedText} />

                        {/* Footer */}
                        <FileUploadDialog setSubmittedText={setSubmittedText} />
                    </>
                    : <>
                        <section className="flex-1 flex">
                            {submittedText}
                        </section>
                    </>
            }
        </>
    )
}