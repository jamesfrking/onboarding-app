import { NextRequest, NextResponse } from 'next/server';

const PORTAL_BACKEND_URL = process.env.PORTAL_BACKEND_URL || 'https://api.wanaware.com';

// POST /api/billing
// Sets up billing via portal-backend (creates Stripe customer, attaches payment method)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { email, stripeCustomerId, paymentMethodId, billingName, billingEmail } = body;

        // Validate required fields
        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const response = await fetch(
            `${PORTAL_BACKEND_URL}/api/partner-onboarding/billing`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    stripeCustomerId,
                    paymentMethodId,
                    billingName: billingName || '',
                    billingEmail: billingEmail || email,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.message || 'Billing setup failed' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Billing setup failed:', error);
        return NextResponse.json(
            { error: 'Billing setup failed' },
            { status: 500 }
        );
    }
}
