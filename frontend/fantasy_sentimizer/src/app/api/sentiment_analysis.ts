export async function getNFLPlayers(): Promise<any> {
    console.log("Here")
    console.log("Calling API")
    const response = await fetch('http://localhost:5000/nfl/athletes', {
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