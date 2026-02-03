export const config = {
    runtime: 'edge',
};

// ⚠️ TESTING ONLY - Never use in production!
const VERIFF_API_KEY = '31b42483-5a70-4d28-b80c-e7116fd7a7b4';
const VERIFF_API_SECRET = 'ce5f9e77-a8a9-4ffc-a4c5-49a600837c99';

export default async function handler(request) {
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
        const {
            companyLegalName,
            executiveName,
            taxId,
            businessAddress,
            city,
            state,
            zipCode,
            country
        } = body;

        // Validate required fields
        if (!companyLegalName || !executiveName || !businessAddress) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Company name, executive name, and business address are required'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Basic address validation (for demo)
        const fullAddress = `${businessAddress}, ${city}, ${state} ${zipCode}`;
        if (fullAddress.length < 10) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid business address format'
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
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create AML screening request
        const amlPayload = {
            type: 'COMPANY', // or 'PERSON' for individual screening
            searches: [
                {
                    searchType: 'COMPANY',
                    company: {
                        name: companyLegalName,
                        registrationNumber: taxId || '',
                        country: country || 'US',
                        address: {
                            fullAddress: `${businessAddress}, ${city}, ${state} ${zipCode}`,
                            country: country || 'US'
                        }
                    }
                },
                // Also screen the executive
                {
                    searchType: 'PERSON',
                    person: {
                        firstName: firstName,
                        lastName: lastName,
                        country: country || 'US'
                    }
                }
            ]
        };

        console.log('📝 Sending AML screening request:', JSON.stringify(amlPayload, null, 2));

        // Call Veriff AML API
        const veriffResponse = await fetch('https://stationapi.veriff.com/v1/aml/screenings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-CLIENT': VERIFF_API_KEY
            },
            body: JSON.stringify(amlPayload)
        });

        if (!veriffResponse.ok) {
            const errorText = await veriffResponse.text();
            console.error('❌ Veriff AML API error:', errorText);

            return new Response(JSON.stringify({
                success: false,
                error: `Veriff AML API failed: ${veriffResponse.status}`,
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
        console.log('✅ AML screening completed:', data);

        // Extract screening results
        const results = data.searches || [];
        const companyScreening = results.find(s => s.searchType === 'COMPANY');
        const personScreening = results.find(s => s.searchType === 'PERSON');

        // Determine overall status
        // matchStatus can be: NO_MATCH, POSSIBLE_MATCH, MATCH
        const companyMatch = companyScreening?.matchStatus || 'NO_MATCH';
        const personMatch = personScreening?.matchStatus || 'NO_MATCH';

        const isApproved = companyMatch === 'NO_MATCH' && personMatch === 'NO_MATCH';

        return new Response(JSON.stringify({
            success: true,
            screeningId: data.id,
            status: isApproved ? 'approved' : 'review_required',
            results: {
                company: {
                    matchStatus: companyMatch,
                    matches: companyScreening?.matches || []
                },
                executive: {
                    matchStatus: personMatch,
                    matches: personScreening?.matches || []
                }
            },
            approved: isApproved
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
