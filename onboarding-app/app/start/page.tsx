'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

interface PartnerData {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    partnerType: string;
    goal: string;
    targetSize: string;
    regions: string;
}

function StartContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const email = searchParams.get('email');

    useEffect(() => {
        if (!email) {
            setError('Missing email parameter. Please start from the partner page.');
            setLoading(false);
            return;
        }

        // Fetch partner data from backend (populated by the dual-write hook)
        async function fetchPartnerData() {
            try {
                const response = await fetch(`/api/partner?email=${encodeURIComponent(email!)}`);
                if (!response.ok) throw new Error('Partner not found');
                const data = await response.json();
                setPartnerData(data);
            } catch {
                // If backend lookup fails, use email and proceed anyway
                setPartnerData({
                    email: email!,
                    firstName: '',
                    lastName: '',
                    company: '',
                    partnerType: '',
                    goal: '',
                    targetSize: '',
                    regions: '',
                });
            } finally {
                setLoading(false);
            }
        }

        fetchPartnerData();
    }, [email]);

    const handleContinue = () => {
        // Store partner data in session storage for subsequent pages
        if (partnerData) {
            sessionStorage.setItem('partnerData', JSON.stringify(partnerData));
        }
        router.push('/kyc');
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

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center shadow-lg">
                    <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
                    <p className="text-slate-600">{error}</p>
                    <a
                        href="https://engage.wanaware.com/partner-program"
                        className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition"
                    >
                        Start Over
                    </a>
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

export default function StartPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        }>
            <StartContent />
        </Suspense>
    );
}
