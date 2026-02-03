import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import https from 'https';

// ⚠️ TESTING ONLY - Never use in production!
const VERIFF_API_KEY = '31b42483-5a70-4d28-b80c-e7116fd7a7b4';
const VERIFF_API_SECRET = 'ce5f9e77-a8a9-4ffc-a4c5-49a600837c99';

function generateSignature(payload: any): string {
    const message = JSON.stringify(payload);
    return createHmac('sha256', VERIFF_API_SECRET)
        .update(message)
        .digest('hex')
        .toLowerCase();
}

// Map frontend country values to Veriff ISO Alpha-2 codes
const COUNTRY_MAP: Record<string, string> = {
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

// Helper function to make HTTPS POST request (no external dependencies)
function httpsPost(url: string, data: any, headers: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);

        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject({ statusCode: res.statusCode, body: parsed });
                    }
                } catch (e) {
                    reject({ statusCode: res.statusCode, body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('🔵 KYC API route called');

    try {
        const body = req.body || {};
        const { email, executiveName, businessAddress, city, state, zipCode, country } = body;

        console.log('📝 Received body:', JSON.stringify(body));

        // Validate required fields
        if (!executiveName || !email) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: email and executiveName are required'
            });
        }

        // Split executive name safely
        const nameParts = executiveName.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Unknown';

        // Map country to Veriff format (ISO Alpha-2)
        const veriffCountry = COUNTRY_MAP[country] || 'US';

        // Create Veriff session payload
        const payload = {
            verification: {
                callback: 'https://webhook.site/unique-url-here',
                person: {
                    firstName,
                    lastName
                },
                document: {
                    country: veriffCountry,
                    type: 'DRIVERS_LICENSE'
                },
                address: {
                    fullAddress: `${businessAddress || ''}, ${city || ''}, ${state || ''} ${zipCode || ''}`.trim(),
                    supportedCountries: [veriffCountry]
                },
                vendorData: email,
                timestamp: new Date().toISOString()
            }
        };

        const signature = generateSignature(payload);

        console.log('🔐 Creating Veriff session for:', email);

        // Call Veriff API using native https module
        const data = await httpsPost(
            'https://stationapi.veriff.com/v1/sessions',
            payload,
            {
                'X-AUTH-CLIENT': VERIFF_API_KEY,
                'X-HMAC-SIGNATURE': signature
            }
        );

        console.log('✅ Veriff session created:', data.verification?.id);

        return res.status(200).json({
            success: true,
            sessionToken: data.verification.id,
            sessionId: data.verification.id,
            sessionUrl: data.verification.url
        });
    } catch (error: any) {
        console.error('❌ Error creating Veriff session:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message || JSON.stringify(error)
        });
    }
}
