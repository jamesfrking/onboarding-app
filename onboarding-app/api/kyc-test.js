export default function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    console.log('✅ JS Handler called');

    return response.status(200).json({
        body: request.body,
        query: request.query,
        cookies: request.cookies,
        message: 'Hello from JavaScript!'
    });
}
