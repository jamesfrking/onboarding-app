import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findEmailFromLocalStorage } from './SigningPage';

interface KycData {
    email: string;
    companyLegalName: string;
    executiveName: string;
    [key: string]: string;
}

export default function SuccessPage() {
    const navigate = useNavigate();
    const [kycData, setKycData] = useState<KycData | null>(null);
    const [isProvisioning, setIsProvisioning] = useState(true);
    const [provisioned, setProvisioned] = useState(false);

    useEffect(() => {
        // Verify documents were signed
        const {email,data} = findEmailFromLocalStorage("_partnerData") as any
        const signed = localStorage.getItem(`${email}_documentsSigned`);
        const provisionedResult = localStorage.getItem(`${email}_provisionResult`)
     
        if (!signed) {
            navigate(`/kyc?email=${email}&partnerType=${data.partnerType}`);
            return;
        } else if(!provisionedResult) {
            // If documents are signed but provisioning not done, start provisioning
            navigate('/signing');
            return;
        }

        // Load KYC data
        const stored = localStorage.getItem(`${email}_kycData`);
        if (stored) {
            setKycData(JSON.parse(stored));
        }

        // Simulate provisioning (in production, this would call the backend)
        setTimeout(() => {
            setIsProvisioning(false);
            setProvisioned(true);

            // Clear session storage after successful provision
            setTimeout(() => {
                localStorage.clear();
            }, 5000);
        }, 3000);
    }, [navigate]);

    if (!kycData) {
        return null;
    }

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="w-16 h-1 bg-emerald-600"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="w-16 h-1 bg-emerald-600"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {provisioned ? '✓' : '3'}
                    </div>
                </div>

                {isProvisioning && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-lg">
                        <div className="w-16 h-16 mx-auto mb-6 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Setting Up Your Account</h1>
                        <p className="text-slate-500 mb-6">Creating your partner organization...</p>
                    </div>
                )}

                {provisioned && (
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
            </div>
        </div>
    );
}
