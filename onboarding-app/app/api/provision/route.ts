import { NextRequest, NextResponse } from 'next/server';

const PORTAL_BACKEND_URL = process.env.PORTAL_BACKEND_URL || 'https://api.wanaware.com';

// POST /api/provision
// Provisions the partner account via portal-backend:
// - Creates Reseller Organization in UAS
// - Creates Admin User (Auth0 sends invite email automatically)
// - Creates Permit.io Tenant for RBAC
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { partner, kyc } = body;

        const email = partner?.email;
        const companyName = kyc?.companyLegalName || partner?.company || '';
        const partnerType = partner?.partnerType || 'msp';
        const fullName = kyc?.executiveName || `${partner?.firstName || ''} ${partner?.lastName || ''}`.trim();

        if (!email) {
            return NextResponse.json(
                { error: 'Email required for provisioning' },
                { status: 400 }
            );
        }

        if (!companyName) {
            return NextResponse.json(
                { error: 'Company name required for provisioning' },
                { status: 400 }
            );
        }

        // Call portal-backend to provision the partner
        // This creates:
        // 1. Reseller Organization in UAS (via createResellerGQL)
        // 2. Admin User with invite flow (via createAdminUserInUAS - Auth0 sends email)
        // 3. Permit.io Tenant for RBAC (via createTenantInPermitIO)
        const response = await fetch(
            `${PORTAL_BACKEND_URL}/api/partner-onboarding/provision`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    companyName,
                    partnerType,
                    fullName,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle specific error cases
            if (response.status === 409) {
                return NextResponse.json(
                    { error: 'A partner with this email or company already exists' },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: errorData.message || 'Account provisioning failed' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Log for analytics
        console.log('Partner provisioned successfully:', {
            email,
            companyName,
            partnerType,
            resellerId: data.resellerId,
            subdomain: data.subdomain,
            timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
            status: 'success',
            message: 'Partner account provisioned',
            resellerId: data.resellerId,
            subdomain: data.subdomain,
            portalUrl: data.portalUrl,
            organizationName: data.organizationName,
        });
    } catch (error) {
        console.error('Provisioning failed:', error);
        return NextResponse.json(
            { error: 'Account provisioning failed' },
            { status: 500 }
        );
    }
}
