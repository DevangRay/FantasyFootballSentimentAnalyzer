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
>(({ className, ...props }, ref) => 
    {
        return (
            <Button ref={ref} {...props} className={className} variant="outline" size="sm">
                Upload Files
            </Button>
        );
    }
);

UploadButton.displayName = "UploadButton";

export default function EmptyState({ error, submit }: { error: string | null, submit: (text: string) => void }) {
    return (
        <Empty className="h-full">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Sprout />
                </EmptyMedia>
                <EmptyTitle>
                    {
                        error ? "Error" : "No Players Found"
                    }
                </EmptyTitle>
                <EmptyDescription className="flex flex-col gap-2">
                    {error ? (
                        <span>
                            {error}
                        </span>
                    ) : (
                        <>
                            <span>
                                No NFL players were identified in the submitted transcript.
                            </span>
                        </>
                    )}
                    <span>
                        Try uploading a different transcript, or returning Home to see the Demo or submit new text.
                    </span>
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <FileUploadDialog onSubmit={submit} DialogButton={UploadButton} />
                <Button>
                    <a href="/" className="text-white-700 hover:text-white-900">
                        Home
                    </a>
                </Button>
            </EmptyContent>
        </Empty>
    )
}
