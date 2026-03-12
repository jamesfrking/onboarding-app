import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    getActiveOnboardingEmail,
    getSessionPartnerData,
    setActiveOnboardingSession,
} from '../utils/onboardingSession';

type VerificationType = 'individual' | 'business';

interface PartnerData {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    website?: string;
    partnerType: string;
    verificationType: VerificationType;
    goal?: string;
    targetSize?: string;
    regions?: string;
    mspOffers?: string;
    whiteLabelRequired?: string;
    // Journey data from questionnaire
    journeyData?: {
        mspOffers?: string[];
        whiteLabelRequired?: string;
        advisorFocus?: string[];
        coBrandRequired?: string;
        timeToStart?: string;
        processOwner?: string;
        activeCustomerBand?: string;
        introAccounts30d?: string;
        kickoffWindow?: string;
        execSponsorNamed?: string;
        weeklyTimeCommitment?: string;
        verificationType?: VerificationType;
        verification_type?: VerificationType;
    };
}

function normalizeVerificationType(value: unknown): VerificationType {
    return value === 'business' ? 'business' : 'individual';
}

export default function StartPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
    const [loading, setLoading] = useState(true);

    const email = searchParams.get('email');

    useEffect(() => {
        const env = (import.meta as unknown as { env: Record<string, string> }).env;
        const BACKEND_URL =
            env.VITE_API_BASE_URL ||
            env.VITE_BACKEND_URL ||
            'https://partners.wanaware.com';
        const existingPartnerData = getSessionPartnerData<PartnerData>();
        const activeEmail = email || getActiveOnboardingEmail();

        const persistPartnerSession = (data: PartnerData) => {
            setPartnerData(data);
            setActiveOnboardingSession(data);
            localStorage.setItem(`${data.email}_partnerData`, JSON.stringify(data));
        };

        if (!email && existingPartnerData) {
            setPartnerData(existingPartnerData);
            setLoading(false);
            return;
        }

        if (!activeEmail) {
            // No email - use demo mode
            persistPartnerSession({
                email: 'demo@example.com',
                firstName: 'Demo',
                lastName: 'Partner',
                company: 'Demo Company',
                partnerType: 'msp',
                verificationType: 'individual',
                goal: 'recurring',
                targetSize: 'SMB',
                regions: 'North America',
            });
            setLoading(false);
            return;
        }

        const userEmail = activeEmail;

        if (email && window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
        }

        async function fetchPartnerData() {
            try {
                // Fetch from backend (populated from HubSpot landing page)
                const response = await fetch(
                    `${BACKEND_URL}/hubspot-onboarding-hook?email=${encodeURIComponent(userEmail)}`
                );

                if (!response.ok) {
                    throw new Error('Partner data not found');
                }

                const data = await response.json();

                // Map backend response to our interface
                persistPartnerSession({
                    email: data.email,
                    firstName: data.first_name || data.firstName || '',
                    lastName: data.last_name || data.lastName || '',
                    company: data.company || '',
                    website: data.website || '',
                    partnerType: data.partner_type || data.partnerType || 'msp',
                    verificationType: normalizeVerificationType(
                        data.verification_type ||
                            data.verificationType ||
                            data.journey_data?.verification_type ||
                            data.journey_data?.verificationType
                    ),
                    goal: data.journey_data?.goal || data.goal || '',
                    targetSize: data.journey_data?.targetCustomerSize || data.targetSize || '',
                    regions: data.journey_data?.regionsServed?.join(', ') || data.regions || '',
                    mspOffers: Array.isArray(data.journey_data?.mspOffers)
                        ? data.journey_data.mspOffers.join('; ')
                        : data.mspOffers || '',
                    whiteLabelRequired:
                        data.journey_data?.whiteLabelRequired ||
                        data.whiteLabelRequired ||
                        '',
                    journeyData: data.journey_data || {},
                });
            } catch (err) {
                console.warn('Backend not available, using demo data:', err);
                // Fallback to demo data with provided email
                persistPartnerSession({
                    email: userEmail,
                    firstName: 'Demo',
                    lastName: 'Partner',
                    company: 'Demo Company',
                    partnerType: 'msp',
                    verificationType: 'individual',
                    goal: 'recurring',
                    targetSize: 'SMB',
                    regions: 'North America',
                });
            } finally {
                setLoading(false);
            }
        }

        fetchPartnerData();
    }, [email]);

    const handleContinue = () => {
        if (partnerData) {
            setActiveOnboardingSession(partnerData);
            navigate('/kyc');
            return;
        }
        navigate('/kyc');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your onboarding session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-lg w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to Wanaware</h1>
                    <p className="text-slate-500">Partner Onboarding</p>
                </div>

                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 mb-6 shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Journey</h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-sm">1</div>
                            <span className="text-slate-700">Company Verification (KYC)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">2</div>
                            <span className="text-slate-500">Billing Setup</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">3</div>
                            <span className="text-slate-500">Sign Agreements</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">4</div>
                            <span className="text-slate-500">Access Your Account</span>
                        </div>
                    </div>
                </div>

                {partnerData && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-slate-500 mb-1">Onboarding as:</p>
                        <p className="text-slate-800 font-medium">{partnerData.email}</p>
                        {partnerData.company && (
                            <p className="text-slate-600 text-sm">{partnerData.company}</p>
                        )}
                    </div>
                )}

                <button
                    onClick={handleContinue}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transition-all duration-300 shadow-lg"
                >
                    Begin Onboarding →
                </button>

                <p className="text-center text-slate-500 text-sm mt-4">
                    Estimated time: 3 minutes
                </p>
            </div>
        </div>
    );
}
