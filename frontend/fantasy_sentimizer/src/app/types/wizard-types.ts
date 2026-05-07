import { LucideIcon } from "lucide-react";


export interface InputButtonOwnProps {
    text: string;
    description: string;
    icon: LucideIcon;
    blobA: string;
    blobB: string;
    isExternal?: boolean;
}

export type InputButtonProps = InputButtonOwnProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof InputButtonOwnProps>;

export type Stage = 1 | 2 | 3;

export interface WizardProgressProps {
    visibleDots: number;
    currentStage: number;
    setStage: React.Dispatch<React.SetStateAction<Stage>>;
}