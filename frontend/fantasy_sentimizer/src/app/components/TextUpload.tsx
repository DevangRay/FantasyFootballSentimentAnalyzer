"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner";

export default function TextUpload({ setSubmittedText }: { setSubmittedText: (text: string) => void }) {
    const [text, setText] = useState<string>("");
    const [uploadingText, setUploadingText] = useState<boolean>(false);

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setText(e.target.value);
    }

    function handleSubmit() {
        setUploadingText(true);

        // simulate upload time
        setTimeout(() => {
            console.log("Uploading text");
            setUploadingText(false);
            setSubmittedText(text);
        }, 1500);
    }

    return (
        <>
            <Button
                onClick={handleSubmit}
                size="lg"
                variant="outline"
                className={`hover:cursor-pointer m-4 self-center 
                            ${text.length > 0 ? 
                                uploadingText ? 
                                    "pointer-events-none" 
                                    : "opacity-100" 
                                : "opacity-0 pointer-events-none"} 
                            `}
            >
                {
                    uploadingText ?
                        <>
                            <Spinner />
                            Uploading...
                        </> :
                        <>
                            Upload transcript
                        </>
                }
            </Button>

            {/* Text Area */}
            <section className="flex-1 flex">
                <textarea
                    autoFocus
                    id="transcript-field"
                    value={text}
                    onChange={handleChange}
                    className="w-full h-full resize-none outline-none bg-transparent p-8 text-xl leading-relaxed font-mono"
                    placeholder="You can copy in the transcript here..."
                />
            </section>
        </>
    )
}