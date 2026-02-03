import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
    console.log('🔵 KYC API route called');
    try {
        const body = await request.json();
        console.log('📝 Request body:', { email: body.email, executiveName: body.executiveName });
        const { email, executiveName, businessAddress, city, state, zipCode, country } = body;

        // Split executive name
        const [firstName, ...lastNameParts] = executiveName.trim().split(' ');
        const lastName = lastNameParts.join(' ');

        // Create Veriff session payload
        const payload = {
            verification: {
                callback: 'https://webhook.site/unique-url-here', // Replace with your webhook.site URL
                person: {
                    firstName,
                    lastName
                },
                document: {
                    country: country || 'USA',
                    type: 'DRIVERS_LICENSE'
                },
                address: {
                    fullAddress: `${businessAddress}, ${city}, ${state} ${zipCode}`,
                    supportedCountries: [country || 'USA']
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
            return NextResponse.json(
                { success: false, error: 'Failed to create Veriff session' },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('Veriff session created:', data.verification.id);

        return NextResponse.json({
            success: true,
            sessionToken: data.verification.id,  // SDK needs this, not URL
            sessionId: data.verification.id,
            sessionUrl: data.verification.url   // Keep for reference
        });
    } catch (error: any) {
        console.error('❌ Error creating Veriff session:', error);
        console.error('Error details:', error.message, error.stack);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: error.message  // Include error details for debugging
            },
            { status: 500 }
        );
    }
}
