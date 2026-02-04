import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface KycData {
    email: string;
    companyLegalName: string;
    executiveName: string;
    [key: string]: string;
}

export default function SigningPage() {
    const navigate = useNavigate();
    const [isSigning, setIsSigning] = useState(false);
    const [kycData, setKycData] = useState<KycData | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        // Load KYC data from sessionStorage
        const stored = sessionStorage.getItem('kycData');
        if (stored) {
            setKycData(JSON.parse(stored));
        } else {
            // If no KYC data, redirect back to KYC page
            navigate('/kyc');
        }
    }, [navigate]);

    const handleSign = async () => {
        if (!agreedToTerms) {
            alert('Please agree to all documents to continue');
            return;
        }

        setIsSigning(true);

        // Simulate document signing delay
        setTimeout(() => {
            // Store signing completion in sessionStorage
            sessionStorage.setItem('documentsSigned', 'true');
            sessionStorage.setItem('signingCompletedAt', new Date().toISOString());

            // Navigate to success page
            navigate('/success');
        }, 2000);
    };

    if (!kycData) {
        return null; // Loading or redirecting
    }

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-3xl mx-auto">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">✓</div>
                    <div className="w-16 h-1 bg-emerald-600"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div className="w-16 h-1 bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">3</div>
                </div>

                <div className="flex items-center justify-center gap-4 mb-8 text-xs text-slate-500">
                    <span className="text-emerald-600 font-semibold">Verification ✓</span>
                    <span>→</span>
                    <span className="font-semibold text-slate-700">Document Signing</span>
                    <span>→</span>
                    <span>Account Setup</span>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Partner Agreement</h1>
                    <p className="text-slate-500">Review and sign the partnership documents</p>
                </div>

                {/* Partner Info Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-slate-500 mb-2">Signing as</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-slate-400">Company:</span>
                            <span className="text-slate-700 ml-2 font-medium">{kycData.companyLegalName}</span>
                        </div>
                        <div>
                            <span className="text-slate-400">Signatory:</span>
                            <span className="text-slate-700 ml-2 font-medium">{kycData.executiveName}</span>
                        </div>
                    </div>
                </div>

                {/* Documents List */}
                <div className="space-y-4 mb-6">
                    <h2 className="text-sm font-semibold text-slate-600 mb-3">BASE DOCUMENTS (Required for all partners)</h2>

                    {/* Document 1: NDA */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-1">Mutual Non-Disclosure Agreement (NDA)</h3>
                                <p className="text-sm text-slate-500 mb-3">Protects confidential information shared between parties</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>8 pages</span>
                                </div>
                            </div>
                            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</a>
                        </div>
                    </div>

                    {/* Document 2: MSA */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-1">Master Service Agreement (MSA)</h3>
                                <p className="text-sm text-slate-500 mb-3">Defines general terms and conditions of partnership</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>12 pages</span>
                                </div>
                            </div>
                            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</a>
                        </div>
                    </div>

                    {/* Document 3: AUP */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-1">Acceptable Use Policy (AUP)</h3>
                                <p className="text-sm text-slate-500 mb-3">Guidelines for acceptable use of WanAware services</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>5 pages</span>
                                </div>
                            </div>
                            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</a>
                        </div>
                    </div>

                    {/* Document 4: DPA */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-1">Data Processing Agreement (DPA)</h3>
                                <p className="text-sm text-slate-500 mb-3">GDPR/privacy compliance for data handling</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>10 pages</span>
                                </div>
                            </div>
                            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</a>
                        </div>
                    </div>

                    <h2 className="text-sm font-semibold text-slate-600 mt-6 mb-3">PARTNER-SPECIFIC ADDENDUM</h2>

                    {/* Partner Addendum - varies by type */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-slate-800">
                                        {kycData.partnerType === 'msp' && 'Managed Service Provider (MSP) Addendum'}
                                        {kycData.partnerType === 'distributor' && 'Distributor Addendum'}
                                        {kycData.partnerType === 'advisor' && 'Technology Advisor Addendum'}
                                        {kycData.partnerType === 'si' && 'System Integrator Addendum'}
                                        {!kycData.partnerType && 'Partner Addendum'}
                                    </h3>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                        {kycData.partnerType?.toUpperCase() || 'PARTNER'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">Partner-specific terms, commission structure, and obligations</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>6 pages</span>
                                </div>
                            </div>
                            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</a>
                        </div>
                    </div>
                </div>

                {/* Agreement Checkbox */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
                        />
                        <span className="text-sm text-slate-700">
                            I have reviewed and agree to all 5 documents listed above on behalf of <strong>{kycData.companyLegalName}</strong>. I confirm that I have the authority to execute these agreements.
                        </span>
                    </label>
                </div>

                {/* Sign Button */}
                <button
                    onClick={handleSign}
                    disabled={!agreedToTerms || isSigning}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSigning ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Signing Documents...
                        </span>
                    ) : (
                        'Sign & Complete Setup →'
                    )}
                </button>

                {/* Security Notice */}
                <p className="text-xs text-slate-400 text-center mt-4">
                    🔒 Your signature is legally binding and encrypted
                </p>
            </div>
        </div>
    );
}
