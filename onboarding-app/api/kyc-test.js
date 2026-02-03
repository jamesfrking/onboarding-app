export const config = {
    runtime: 'edge',
};

// ⚠️ TESTING ONLY - Never use in production!
const VERIFF_API_KEY = '31b42483-5a70-4d28-b80c-e7116fd7a7b4';
const VERIFF_API_SECRET = 'ce5f9e77-a8a9-4ffc-a4c5-49a600837c99';

// Map frontend country values to Veriff ISO Alpha-2 codes
const COUNTRY_MAP = {
    'US': 'US',
    'USA': 'US',
    'CA': 'CA',
    'CAN': 'CA',
    'UK': 'GB',
    'GB': 'GB',
    'GBR': 'GB',
    'AU': 'AU',
    'AUS': 'AU'
};

async function generateSignature(payloadString) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(VERIFF_API_SECRET);
    const message = encoder.encode(payloadString);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, message);

    // Convert buffer to hex string
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export default async function handler(request) {
    // ... [keep CORS handling] ...
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
        const { email, executiveName, businessAddress, city, state, zipCode, country } = body;

        // ... [keep validation] ...
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

        // Split executive name
        const nameParts = executiveName.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Unknown';

        // Map country
        const veriffCountry = COUNTRY_MAP[country] || 'US';

        // Create Veriff session payload - TESTED AND WORKING
        // Empty verification object is the minimum required per docs
        const payload = {
            verification: {}
        };

        const payloadString = JSON.stringify(payload);

        console.log('📝 Sending payload to Veriff:', payloadString);

        // Call Veriff API - NO X-HMAC-SIGNATURE needed for POST /sessions per docs
        const veriffResponse = await fetch('https://stationapi.veriff.com/v1/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-CLIENT': VERIFF_API_KEY
            },
            body: payloadString
        });

        if (!veriffResponse.ok) {
            const errorText = await veriffResponse.text();
            console.error('❌ Veriff API error:', errorText);

            return new Response(JSON.stringify({
                success: false,
                error: `Veriff API failed: ${veriffResponse.status}`,
                details: errorText
            }), {
                status: veriffResponse.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const data = await veriffResponse.json();
        console.log('✅ Veriff session created:', data.verification.id);

        return new Response(JSON.stringify({
            success: true,
            sessionToken: data.verification.id,
            sessionId: data.verification.id,
            sessionUrl: data.verification.url,
            verificationUrl: data.verification.url // Frontend expects this sometimes
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('❌ Internal Error:', error);
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
