"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const FileUploadButton = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
    return (
        <footer ref={ref} className={cn("p-4 text-center border-t bg-purple-200 hover:bg-purple-300 border-gray-200 text-sm text-gray-500 hover:text-white hover:cursor-pointer", className)} {...props}>
            <button className="hover:cursor-pointer">...or upload a file</button>
        </footer>
    );
}
);

FileUploadButton.displayName = "FileUploadButton";
export default FileUploadButton;

// export default function FileUploadButton() {

//     return (
//         <>
//             <footer className="p-4 text-center border-t bg-purple-200 hover:bg-purple-300 border-gray-200 text-sm text-gray-500 hover:text-white hover:cursor-pointer">
//                 <button className="hover:cursor-pointer">Or upload a file</button>
//             </footer>
//         </>
//     )
// }