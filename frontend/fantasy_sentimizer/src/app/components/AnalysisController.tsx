import { useState } from "react";

import { Button } from "@/components/ui/button";

import { getNFLPlayers } from "../api/sentiment_analysis";
import { Spinner } from "@/components/ui/spinner";

export default function AnalysisController({ submittedText }: { submittedText: string }) {
    const [loading, setLoading] = useState<boolean>(false);

    async function callAPI() {
        setLoading(true);
        console.log("calling api")
        const response = await getNFLPlayers();
        console.log("response: ", response);
        setLoading(false);
    }

    return (
        <>
            {submittedText}
            {
                loading ?
                    <Button disabled><Spinner /> Loading...</Button>
                    : <Button onClick={callAPI}>CLick me</Button>
            }
        </>
    )
}