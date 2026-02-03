import { NextRequest, NextResponse } from 'next/server';

const PORTAL_BACKEND_URL = process.env.PORTAL_BACKEND_URL || 'https://api.wanaware.com';

// POST /api/kyc
// Validates KYC data via portal-backend (which may call external KYC provider)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            email,
            companyLegalName,
            companyWebsite,
            taxId,
            executiveName,
            executiveTitle,
            businessAddress,
            city,
            state,
            zipCode,
            country,
        } = body;

        // Validate required fields
        if (!email || !companyLegalName || !executiveName || !businessAddress) {
            return NextResponse.json(
                { error: 'Missing required fields: email, companyLegalName, executiveName, businessAddress' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${PORTAL_BACKEND_URL}/api/partner-onboarding/kyc`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    companyLegalName,
                    companyWebsite,
                    taxId,
                    executiveName,
                    executiveTitle,
                    businessAddress,
                    city,
                    state,
                    zipCode,
                    country,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.message || 'KYC verification failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('KYC verification failed:', error);
        return NextResponse.json(
            { error: 'KYC verification failed' },
            { status: 500 }
        );
    }
}
