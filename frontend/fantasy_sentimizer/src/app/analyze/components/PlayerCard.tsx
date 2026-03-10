import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ImageWithFallback } from "@/app/components/ImageWithBackup";
import { Chart } from "@/app/analyze/components/Chart";
import { MatchingStatus, MatchingStatusConst } from "@/app/types/analyze-types";

export default function PlayerCard({ player, analysisResult }: { player: string, analysisResult: Record<string, any> }) {

    function renderConfidence(matchingStatus: MatchingStatus, originalName: string) {
        if (matchingStatus === MatchingStatusConst.perfect) {
            return <span className="text-green-500 font-bold">Perfect Match</span>
        }
        else if (matchingStatus === MatchingStatusConst.imperfect) {
            return <span className="text-yellow-500 font-bold">Partial Match (Original Name: {originalName})</span>
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>
                        <div className="flex flex-row">
                            <span className="text-2xl font-bold">{player}</span>
                            <span>{renderConfidence(analysisResult[player].status, analysisResult[player].transcript_name)}</span>
                        </div>
                    </CardTitle>
                    <CardDescription>Player Matching: {analysisResult[player].status} | Original Name: {analysisResult[player].transcript_name}</CardDescription>
                    <CardAction>See more details</CardAction>
                </CardHeader>
                <CardContent className="flex flex-row items-center justify-space-evenly">
                    <div>
                        <ImageWithFallback src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${analysisResult[player].player_id}.png`} alt={`${player}'s Profile Photo`} width={100} height={100} />
                        <>
                            <h3>Average Label: {analysisResult[player].average_label}</h3>
                            <h3>Mode Label: {analysisResult[player].most_frequent_label}</h3>
                        </>
                    </div>
                    <Chart chartData={Object.entries(analysisResult[player].sentiment_consensus).map(([pole, value]) => ({ pole, value: (1 / Math.abs(value as number)) }))} />

                </CardContent>
                {/* <CardFooter>
                                            <>
                                                <h4>Ratings:</h4>
                                                <h4>Negative {analysisResult[player].sentiment_consensus.negative}</h4>
                                                <h4>Positive {analysisResult[player].sentiment_consensus.positive}</h4>
                                                <h4>Neutral {analysisResult[player].sentiment_consensus.neutral}</h4>
                                            </>
                                        </CardFooter> */}
            </Card>
        </>
    )
}