"use client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Dropzone,
    DropzoneContent,
    DropzoneEmptyState,
} from '@/components/ui/shadcn-io/dropzone';
import { Spinner } from "@/components/ui/spinner"

import FileUploadButton from "../FileUploadButton"

import { useState } from "react"

export default function FileUploadDialog({ setSubmittedText }: { setSubmittedText: (text: string) => void }) {
    const [openDialog, setOpenDialog] = useState<boolean>(false);
    const [file, setFile] = useState<File[]>([]);
    const [fileContent, setFileContent] = useState<string>("");
    const [uploadingFile, setUploadingFile] = useState<boolean>(false);

    function handleDrop(droppedFile: File[]) {
        // guaranteed to be single file due to multiple={false} and maxFiles={1}
        console.log(droppedFile);
        setFile(droppedFile);
    };

    function handleCancel() {
        console.log("Cancelling Modal");
        setFile([])
    };

    function handleUpload() {
        if (file && file.length !== 1) return;

        setUploadingFile(true);

        console.log("Uploading file: ", file);
        const reader = new FileReader();
        // reader.onload = (event) => {
        //     const text = event.target?.result as string;
        //     setFileContent(text);
        //     console.log("File content: ", text);
        // };
        // reader.readAsText(file[0]);

        // simulate upload time
        setTimeout(() => {
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setFileContent(text);
                console.log("File content: ", text);
            };
            reader.readAsText(file[0]);
            
            console.log("File uploaded");
            setUploadingFile(false);
            setOpenDialog(false);
            setFile([]);

            setSubmittedText(fileContent)
        }, 1500);
    }

    return (
        <Dialog
            open={openDialog}
            onOpenChange={(open) => {
                setOpenDialog(open);

                if (!open) {
                    // dialog is closing
                    setFile([]);
                    setUploadingFile(false);
                }
            }}
        >
            <DialogTrigger asChild>
                <FileUploadButton />
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>File Upload</DialogTitle>
                    <DialogDescription>
                        Please upload a text file, and we'll handle the rest.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                    <div className="grid flex-1 gap-2">
                        <Dropzone
                            maxFiles={1}
                            accept={{
                                "text/plain": [".txt"],
                            }}
                            maxSize={1024 * 1024 * 1} // 1MB
                            // minSize={1024}
                            multiple={false}
                            onDrop={handleDrop}
                            onError={console.error}
                            src={file}
                            className="hover:cursor-pointer"
                        >
                            <DropzoneEmptyState />
                            <DropzoneContent />
                        </Dropzone>


                    </div>
                </div>
                <DialogFooter className="sm:justify-start">
                    <DialogClose onClick={handleCancel} className="hover:cursor-pointer" asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>

                    {file && file.length == 1 && <>
                        {
                            uploadingFile ?
                                <Button
                                    disabled
                                    type="button"
                                    variant="default">
                                    <Spinner /> Uploading...
                                </Button>
                                : <Button
                                    className="hover:cursor-pointer"
                                    onClick={handleUpload}
                                    type="button"
                                    variant="default">
                                    Upload file
                                </Button>
                        }
                    </>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
