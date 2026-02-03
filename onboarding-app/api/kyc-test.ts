import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

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

        // Validate required fields
        if (!executiveName || !email) {
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

        console.log('Creating Veriff session for:', email);

        // Call Veriff API
        const response = await fetch('https://stationapi.veriff.com/v1/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-CLIENT': VERIFF_API_KEY,
                'X-HMAC-SIGNATURE': signature
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Veriff API error:', error);
            return res.status(response.status).json({
                success: false,
                error: 'Failed to create Veriff session'
            });
        }

        const data = await response.json();
        console.log('Veriff session created:', data.verification.id);

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
            details: error.message
        });
    }
}
