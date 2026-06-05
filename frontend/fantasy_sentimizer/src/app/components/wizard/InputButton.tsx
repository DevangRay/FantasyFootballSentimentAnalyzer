import * as React from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputButtonProps } from "@/app/types/wizard-types";

const InputButton = React.forwardRef<HTMLButtonElement, InputButtonProps>(
    ({ text, description, icon: Icon, blobA, blobB, isExternal, loading, className, ...props }, ref) => {
        return (
            <button
                ref={ref}
                {...props}
                className={cn("group relative flex-1 flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-1 hover:translate-x-0.5 active:-translate-y-1 active:translate-x-0.5 text-left shadow-md disabled:cursor-prpgress disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:active:translate-y-0 disabled:active:translate-x-0", className)}
            >
                {/* Gradient blobs */}
                <div className={`absolute inset-0 ${blobA} opacity-60 pointer-events-none`} />
                <div className={`absolute inset-0 ${blobB} opacity-60 pointer-events-none`} />

                {/* Glass layer */}
                <div className="absolute inset-0 border border-black/10 bg-white/50 backdrop-blur-sm rounded-2xl pointer-events-none" />

                {/* Shimmer overlay */}
                <div
                    className="absolute group-hover:animate-[shimmer-diagonal_0.6s_ease-in-out] pointer-events-none z-10"
                    style={{
                        background: "linear-gradient(45deg, transparent 0%, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%, transparent 100%)",
                        transform: "translate(-50%, 50%)",
                        width: "200%",
                        height: "200%",
                        top: "-70%",
                        left: "-70%",
                    }}
                />

                {/* External link badge */}
                {isExternal && (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-black/8 px-2 py-0.5">
                        <ExternalLink className="size-3 text-foreground/50" />
                        <span className="text-[10px] text-foreground/50 font-medium">Opens new tab</span>
                    </div>
                )}

                {/* Content */}
                <div className={cn("relative z-10 flex flex-col items-center gap-4 px-6 py-10 transition-all duration-200", loading && "blur-sm opacity-40")}>
                    <div className="p-3 rounded-full bg-white/50">
                        <Icon className="size-8" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{text}</h3>
                    <p className="text-xs text-foreground/60 md:text-center leading-relaxed">{description}</p>
                </div>

                {loading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-foreground/70" />
                    </div>
                )}
            </button>
        )
    });

InputButton.displayName = "InputButton";
export default InputButton;
