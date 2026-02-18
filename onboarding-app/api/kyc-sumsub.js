export const config = {
    runtime: 'edge',
};

// ⚠️ TESTING ONLY - Replace with your Sumsub Sandbox credentials
// Get these from: https://cockpit.sumsub.com → Developers → App Tokens (Sandbox mode)
const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN || 'YOUR_SANDBOX_APP_TOKEN';
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY || 'YOUR_SANDBOX_SECRET_KEY';
const SUMSUB_LEVEL_NAME = process.env.SUMSUB_LEVEL_NAME || 'basic-kyc-level';
const SUMSUB_BASE_URL = 'https://api.sumsub.com';

/**
 * Generate HMAC-SHA256 signature for Sumsub API authentication.
 * Sumsub signs: timestamp + httpMethod + urlPath + body
 * Uses Web Crypto API (Edge Runtime compatible).
 */
async function generateSignature(ts, method, urlPath, body = '') {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SUMSUB_SECRET_KEY);
    const message = encoder.encode(ts + method.toUpperCase() + urlPath + body);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, message);

    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export default async function handler(request) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        const { email, executiveName } = body;

        // Validate required fields
        if (!executiveName || !email) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields: email and executiveName are required'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Unique userId per verification so Sumsub creates a fresh applicant each time
        // In production, use a stable ID (e.g., database user ID) so returning users resume
        const userId = `${email}-${Date.now()}`;

        // Sumsub /sdk endpoint - takes JSON body with all params
        const urlPath = '/resources/accessTokens/sdk';
        const requestBody = JSON.stringify({
            applicantIdentifiers: {
                email: email
            },
            ttlInSecs: 600,
            userId: userId,
            levelName: SUMSUB_LEVEL_NAME
        });

        // Generate Sumsub HMAC signature: sign(timestamp + METHOD + path + body)
        const ts = Math.floor(Date.now() / 1000).toString();
        const signature = await generateSignature(ts, 'POST', urlPath, requestBody);

        // Call Sumsub API to generate access token
        const sumsubResponse = await fetch(`${SUMSUB_BASE_URL}${urlPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-App-Token': SUMSUB_APP_TOKEN,
                'X-App-Access-Sig': signature,
                'X-App-Access-Ts': ts
            },
            body: requestBody
        });

        if (!sumsubResponse.ok) {
            const errorText = await sumsubResponse.text();

            return new Response(JSON.stringify({
                success: false,
                error: `Sumsub API failed: ${sumsubResponse.status}`,
                details: errorText
            }), {
                status: sumsubResponse.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const data = await sumsubResponse.json();

        return new Response(JSON.stringify({
            success: true,
            token: data.token,
            userId: data.userId
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
