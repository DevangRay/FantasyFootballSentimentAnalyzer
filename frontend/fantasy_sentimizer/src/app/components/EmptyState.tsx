import { Button } from "@/components/ui/button"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { Sprout } from "lucide-react"
import FileUploadDialog from "@/app/components/dialogs/FileUploadDialog"
import * as React from "react";

const UploadButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
    return (
        <Button ref={ref} {...props} className={className} variant="outline" size="sm">
            Upload Files
        </Button>
    );
}
);

UploadButton.displayName = "UploadButton";

export default function EmptyState({ setSubmittedText }: { setSubmittedText: React.Dispatch<React.SetStateAction<string | null>>}) {
    return (
        <Empty className="border border-dashed">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    {/* <IconCloud /> */}
                    <Sprout />
                </EmptyMedia>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription className="flex flex-col gap-2">
                    <span>
                        No NFL players were identified in the submitted transcript.
                    </span>
                    <span>
                        Try uploading a different transcript or check out the demo transcript to see an example of the expected format.
                    </span>
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <FileUploadDialog setSubmittedText={setSubmittedText} DialogButton={UploadButton} />
            </EmptyContent>
        </Empty>
    )
}
