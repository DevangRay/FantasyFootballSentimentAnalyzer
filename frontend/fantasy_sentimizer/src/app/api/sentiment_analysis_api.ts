import { SentimentObject } from "@/app/types/analyze-types";

const API_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function performAnalysisStream(
    text: string,
    onEventRecieved: (progress: number, message: string) => void,
    onComplete: (result: SentimentObject) => void,
    signal?: AbortSignal
): Promise<void> {
    const response = await fetch(`${API_BACKEND_BASE_URL}/analyze_stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            transcript: text
        }),
        signal,
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Failed to get reader from response body');
    }
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            console.log('Stream complete');
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
            const line = part.trim();
            console.log("Received line: ", line);
            if (!line.startsWith('data: ')) {
                console.warn('Skipping non-data line: ', line);
                continue;
            }

            try {
                const jsonData = JSON.parse(line.replace('data: ', ''));
                console.log("Parsed JSON data: ", jsonData);
    
                if (jsonData.progress === 100) {
                    console.log("Analysis complete, final result: ", jsonData.result);
    
                    onEventRecieved(jsonData.progress, jsonData.message);
                    onComplete(jsonData.result);
                } else {
                    onEventRecieved(jsonData.progress, jsonData.message);
                }
            } catch (error) {
                console.error("Failed to parse SSE message: ", line, error);
            }
        }
    }
}
