const API_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function getNFLPlayers(): Promise<any> {
    console.log("Here")
    console.log("Calling API")
    const response = await fetch(`${API_BACKEND_BASE_URL}/nfl/athletes`, {
        method: 'GET'
    });
    console.log("Got response")
    const data = await response.json();

    console.log("data: ", data);
    console.dir(data)

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    return data;
}

export async function performAnalysis(text: string): Promise<any> {
    const response = await fetch(`${API_BACKEND_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            transcript: text
        }),
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("setup final_player_object is")
    console.dir(data)
    return data;
}

export async function getPlayerObjectForAnalysis(text: string): Promise<any> {
    const response = await fetch(`${API_BACKEND_BASE_URL}/analyze/setup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("setup final_player_object is")
    console.dir(data)
    return data;
}

