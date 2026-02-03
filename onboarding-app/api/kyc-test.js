export const config = {
    runtime: 'edge',
};

export default function handler(request) {
    return new Response(
        JSON.stringify({
            message: 'Hello from Edge Runtime!',
            url: request.url,
            timestamp: new Date().toISOString()
        }),
        {
            status: 200,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
        }
    );
}
