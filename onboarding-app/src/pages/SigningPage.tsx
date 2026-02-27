import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';

interface KycData {
    email: string;
    companyLegalName: string;
    executiveName: string;
    partnerType?: string;
}

// Memoized sub-components
const ProgressStep = memo(({ completed, active, number }: { completed?: boolean; active?: boolean; number?: number }) => (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
        completed ? 'bg-emerald-600' : active ? 'bg-slate-800' : number ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-slate-200 text-slate-500'
    }`}>
        {completed ? '✓' : number || '3'}
    </div>
));

const DocumentIcon = memo(() => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
));

const CheckIcon = memo(() => (
    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
));

const DocumentCard = memo(({ title, description, pages, signingComplete }: {
    title: string;
    description: string;
    pages: number;
    signingComplete: boolean;
}) => (
    <div className={`bg-white border rounded-xl p-6 transition-colors ${signingComplete ? 'border-slate-300' : 'border-slate-200 hover:border-slate-300'}`}>
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                    {signingComplete && <CheckIcon />}
                </div>
                <p className="text-sm text-slate-500 mb-3">{description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <DocumentIcon />
                    <span>{pages} pages</span>
                </div>
            </div>
            <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</a>
        </div>
    </div>
));

export default function SigningPage() {
    const navigate = useNavigate();
    const [isSigning, setIsSigning] = useState(false);
    const [kycData, setKycData] = useState<KycData | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [signingComplete, setSigningComplete] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    // Check envelope status from DocuSign
    const checkEnvelopeStatus = useCallback(async () => {
        try {
            setIsCheckingStatus(true)
            const envelopeId = sessionStorage.getItem('docusignEnvelopeId');
            if (!envelopeId) return null;

            const response = await fetch(`http://localhost:4000/api/partner/sign/status?envelopeId=${envelopeId}`);
            const result = await response.json();

            if (result.status === 'completed') {
                // Convert signedAt to ISO date format
                setSigningComplete(true);
                setIsSigning(false);
            }
            setIsCheckingStatus(false);
        } catch (error) {
            setIsCheckingStatus(false);
        }
    }, []);

    useEffect(() => {
        // Load KYC data from sessionStorage
        const stored = sessionStorage.getItem('kycData');
        if (stored) {
            setKycData(JSON.parse(stored));
        } else {
            // If no KYC data, redirect back to KYC page
            navigate('/kyc');
            return;
        }

        
        const urlParams = new URLSearchParams(window.location.search);
        const event = urlParams.get('event');
        if (event === 'signing_complete') {
            checkEnvelopeStatus();
            
            // Clean up URL without the query parameter
            window.history.replaceState({}, '', '/signing');
        }
    }, [navigate]);

    const handleSign = useCallback(async () => {
        if (!agreedToTerms) {
            setErrorMessage('Please agree to all documents to continue');
            return;
        }

        setIsSigning(true);
        setErrorMessage(null);

        try {
            // Get partner data from session storage
            const partnerDataStr = sessionStorage.getItem('partnerData');
            const partnerData = partnerDataStr ? JSON.parse(partnerDataStr) : null;
            
            // Call DocuSign envelope creation API
            const response = await fetch('http://localhost:4000/api/partner/sign/create-envelope', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: kycData?.email,
                    signerName: kycData?.executiveName,
                    partnerType: partnerData?.partnerType || 'advisor',
                    companyName: kycData?.companyLegalName,
                    returnUrl: `${window.location.origin}/signing?event=signing_complete`,
                }),
            });

            const result = await response.json();

            if (result.success && result.signingUrl) {
                // Store envelope ID for tracking
                sessionStorage.setItem('docusignEnvelopeId', result.envelopeId);

                // Navigate to signing URL in current window
                window.location.href = result.signingUrl;
            } else {
                setErrorMessage(result.message || 'Failed to initialize document signing. Please try again.');
                setIsSigning(false);
            }
        } catch (error) {
            setErrorMessage('An error occurred while setting up document signing. Please try again.');
            setIsSigning(false);
        }
    }, [agreedToTerms, kycData, checkEnvelopeStatus]);

    const handleTryAgain = useCallback(() => {
        setErrorMessage(null);
        setIsSigning(false);
        setAgreedToTerms(false);
    }, []);

    const handleContinue = useCallback(() => navigate('/success'), [navigate]);

    const handleCheckboxChange = useCallback((checked: boolean) => {
        setAgreedToTerms(checked);
        if (checked) setErrorMessage(null);
    }, []);

    // Memoized values
    const partnerAddendumTitle = useMemo(() => {
        const titles: Record<string, string> = {
            msp: 'Managed Service Provider (MSP) Addendum',
            distributor: 'Distributor Addendum',
            advisor: 'Technology Advisor Addendum',
            si: 'System Integrator Addendum',
        };
        return titles[kycData?.partnerType || ''] || 'Partner Addendum';
    }, [kycData?.partnerType]);

    const documents = useMemo(() => [
        { title: 'Mutual Non-Disclosure Agreement (NDA)', description: 'Protects confidential information shared between parties', pages: 8 },
        { title: 'Master Service Agreement (MSA)', description: 'Defines general terms and conditions of partnership', pages: 12 },
        { title: 'Acceptable Use Policy (AUP)', description: 'Guidelines for acceptable use of WanAware services', pages: 5 },
        { title: 'Data Processing Agreement (DPA)', description: 'GDPR/privacy compliance for data handling', pages: 10 },
    ], []);

    const buttonContent = useMemo(() => {
        if (signingComplete) {
            return (
                <>
                    Continue to Account Setup
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </>
            );
        }
        if (isSigning) {
            return (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Opening DocuSign...
                </>
            );
        }
        return 'Sign Documents with DocuSign →';
    }, [signingComplete, isSigning]);

    if (!kycData) return null;

    // Show loading while checking status
    if (isCheckingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Verifying document status...</p>
                    <p className="text-xs text-slate-400 mt-2">Please wait</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-3xl mx-auto">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <ProgressStep completed />
                    <div className="w-16 h-1 bg-emerald-600"></div>
                    <ProgressStep number={2} completed={signingComplete} />
                    <div className={`w-16 h-1 ${signingComplete ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                    <ProgressStep active={signingComplete} />
                </div>

                <div className="flex items-center justify-center gap-4 mb-8 text-xs text-slate-500">
                    <span className="text-emerald-600 font-semibold">Verification ✓</span>
                    <span>→</span>
                    <span className={`font-semibold ${signingComplete ? 'text-emerald-600' : 'text-slate-700'}`}>
                        Document Signing {signingComplete && '✓'}
                    </span>
                    <span>→</span>
                    <span className={signingComplete ? 'text-slate-700 font-semibold' : ''}>Account Setup</span>
                </div>

                {/* Error Message - shown when there's an error */}
                {errorMessage && !signingComplete ? (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4 animate-fadeIn">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-red-800">Document signing could not be completed</p>
                            <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
                        </div>
                        <button onClick={handleTryAgain} className="ml-auto px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Success Message - shown when signing is complete */}
                        {signingComplete && (
                            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 animate-fadeIn">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-emerald-800 mb-1">Documents Signed Successfully!</h3>
                                        <p className="text-xs text-emerald-700">
                                            All partnership documents have been signed and submitted. Your agreements are now legally binding.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-slate-800 mb-2">Partner Agreement</h1>
                            <p className="text-slate-500">
                                {signingComplete ? 'Your documents have been signed' : 'Review and sign the partnership documents'}
                            </p>
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
                            {documents.map((doc) => (
                                <DocumentCard key={doc.title} {...doc} signingComplete={signingComplete} />
                            ))}

                            <h2 className="text-sm font-semibold text-slate-600 mt-6 mb-3">PARTNER-SPECIFIC ADDENDUM</h2>

                            {/* Partner Addendum - varies by type */}
                            <div className={`border rounded-xl p-6 transition-colors ${signingComplete ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200 hover:border-blue-300'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-800">{partnerAddendumTitle}</h3>
                                            {signingComplete && <CheckIcon />}
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                {kycData.partnerType?.toUpperCase() || 'PARTNER'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-3">Partner-specific terms, commission structure, and obligations</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <DocumentIcon />
                                            <span>6 pages</span>
                                        </div>
                                    </div>
                                    <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</a>
                                </div>
                            </div>
                        </div>

                        {/* Agreement Checkbox - hide when signed */}
                        {!signingComplete && (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={agreedToTerms}
                                        onChange={(e) => handleCheckboxChange(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
                                    />
                                    <span className="text-sm text-slate-700">
                                        I have reviewed and agree to all 5 documents listed above on behalf of <strong>{kycData.companyLegalName}</strong>. I confirm that I have the authority to execute these agreements.
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={signingComplete ? handleContinue : handleSign}
                            disabled={!signingComplete && (!agreedToTerms || isSigning)}
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="flex items-center justify-center gap-2">{buttonContent}</span>
                        </button>

                        {/* Security Notice */}
                        <p className="text-xs text-slate-400 text-center mt-4">
                            🔒 {signingComplete ? 'Documents secured by DocuSign' : 'Your signature is legally binding and encrypted'}
                        </p>
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

