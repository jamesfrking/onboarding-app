import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKycData } from '../utils/kycUtils';
import {
    clearActiveOnboardingSession,
    getActiveOnboardingEmail,
    setActiveOnboardingEmail,
} from '../utils/onboardingSession';

interface KycData {
    email: string;
    companyLegalName: string;
    executiveName: string;
    partnerType?: string;
    [key: string]: string | undefined;
}

export default function SuccessPage() {
    const navigate = useNavigate();
    const [kycData, setKycData] = useState<KycData | null>(null);
    const [isProvisioning, setIsProvisioning] = useState(true);
    const [provisioned, setProvisioned] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    useEffect(() => {
        const initializePage = async () => {
            setIsCheckingStatus(true);
            
            const urlParams = new URLSearchParams(window.location.search);
            const urlEmail = urlParams.get('email');
            const activeEmail = urlEmail || getActiveOnboardingEmail();
            
            if (!activeEmail) {
                setErrorMessage('Onboarding session not found. Please restart from your onboarding link.');
                setIsCheckingStatus(false);
                return;
            }
            
            const result = getKycData(activeEmail, '_kycData');
            
            if (!result || !result.email || !result.data) {
                navigate('/kyc', { replace: true });
                setErrorMessage('Session data not found. Please complete the onboarding process from the beginning.');
                setIsCheckingStatus(false);
                return;
            }

            const currentEmail = result.email;
            setActiveOnboardingEmail(currentEmail);
            
            const signed = localStorage.getItem(`${currentEmail}_documentsSigned`);
            const provisionedResult = localStorage.getItem(`${currentEmail}_provisionResult`);
         
            if (!signed) {
                navigate('/kyc', { replace: true });
                return;
            } else if (!provisionedResult) {
                navigate('/signing', { replace: true });
                return;
            }

            if (window.location.search) {
                window.history.replaceState({}, '', window.location.pathname);
            }

            setKycData(result.data);
            setIsCheckingStatus(false);

            setTimeout(() => {
                setIsProvisioning(false);
                setProvisioned(true);

                setTimeout(() => {
                    const emailPrefix = currentEmail;
                    const keysToRemove = [
                        `${emailPrefix}_kycData`,
                        `${emailPrefix}_partnerData`,
                        `${emailPrefix}_inquiryId`,
                        `${emailPrefix}_signingEnvelopeId`,
                        `${emailPrefix}_kycStatus`,
                        `${emailPrefix}_documentsSigned`,
                        `${emailPrefix}_provisionResult`,
                    ];
                    
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                    clearActiveOnboardingSession();
                }, 5000);
            }, 3000);
        };

        initializePage();
    }, [navigate]);

    if (isCheckingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading...</p>
                    <p className="text-xs text-slate-400 mt-2">Please wait</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-2xl mx-auto">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="w-16 h-1 bg-emerald-600"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="w-16 h-1 bg-emerald-600"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {provisioned ? '✓' : '3'}
                    </div>
                </div>

                {/* Error Message */}
                {errorMessage ? (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4 animate-fadeIn">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800">Account Setup Error</p>
                            <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Provisioning State */}
                        {isProvisioning && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-lg">
                                <div className="w-16 h-16 mx-auto mb-6 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                                <h1 className="text-2xl font-bold text-slate-800 mb-2">Setting Up Your Account</h1>
                                <p className="text-slate-500 mb-6">Creating your partner organization...</p>
                            </div>
                        )}

                        {/* Success State */}
                        {provisioned && kycData && (
                            <div className="bg-white border border-emerald-200 rounded-2xl p-12 text-center shadow-lg">
                                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to WanAware!</h1>
                                <p className="text-lg text-slate-600 mb-8">Your partner account has been created</p>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                                    <h3 className="font-semibold text-blue-900 mb-3">📧 Check Your Email</h3>
                                    <p className="text-sm text-blue-800">
                                        We sent login credentials to <strong>{kycData.email}</strong>
                                    </p>
                                </div>

                                <a
                                    href="https://portal.wanaware.com"
                                    className="inline-block w-full py-3.5 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:shadow-xl transition-all"
                                >
                                    Go to Partner Portal →
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
