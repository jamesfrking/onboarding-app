import { NextRequest, NextResponse } from 'next/server';

const PORTAL_BACKEND_URL = process.env.PORTAL_BACKEND_URL || 'https://api.wanaware.com';

// GET /api/partner?email=...
// Fetches partner data from portal-backend (which received it from the dual-write hook)
export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    try {
        const response = await fetch(
            `${PORTAL_BACKEND_URL}/api/partner-onboarding/partner/${encodeURIComponent(email)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
            }
            throw new Error(`Backend returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Partner lookup failed:', error);
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
}
