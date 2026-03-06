import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { getKycData } from '../utils/kycUtils';

interface KycData {
    email: string;
    companyLegalName: string;
    executiveName: string;
    partnerType?: string;
}

// Helper function to find email from localStorage
export const findEmailFromLocalStorage = (suffix: string = '_kycData'): { email: string; data: any } | null => {
    const allKeys = Object.keys(localStorage);
    
    for (const key of allKeys) {
        if (key.endsWith(suffix)) {
            const email = key.replace(suffix, '');
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    return { email, data: JSON.parse(stored) };
                } catch {
                    return null;
                }
            }
        }
    }
    
    return null;
};

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

const DocumentCard = memo(({ title, description, pages, signingComplete, onPreview }: {
    title: string;
    description: string;
    pages: number;
    signingComplete: boolean;
    onPreview: () => void;
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
            <button onClick={onPreview} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</button>
        </div>
    </div>
));

const PreviewModal = memo(({ document, onClose }: { document: any; onClose: () => void }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    if (!document) return null;

    // Import from src/templates folder
    const pdfUrl = `/src/templates/${document.previewName}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl text-[#130032e6]">Document Preview</h1>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-hidden bg-slate-100">
                    {error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center py-12 px-6">
                                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-slate-600 font-medium mb-2">Unable to load document preview</p>
                                <p className="text-sm text-slate-500 mb-4">{error}</p>
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Open in New Tab
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    ) : (
                        <>
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className="text-sm text-slate-600">Loading PDF...</p>
                                    </div>
                                </div>
                            )}
                            <iframe
                                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                className="w-full h-full border-0"
                                title="Document Preview"
                                onLoad={() => setLoading(false)}
                                onError={() => {
                                    setLoading(false);
                                    setError('Failed to load PDF document. Please check if the file exists in src/templates folder.');
                                }}
                            />
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
                
                    <div>
                        <h1 className="text-[18px] text-slate-800">{document?.previewName}</h1>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default function SigningPage() {
    const navigate = useNavigate();
    const [isSigning, setIsSigning] = useState(false);
    const [kycData, setKycData] = useState<KycData | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [signingComplete, setSigningComplete] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [previewDocument, setPreviewDocument] = useState<any>(null);
    const [userEmail, setUserEmail] = useState<string>('');

    // Check envelope status from DocuSign
    const checkEnvelopeStatus = useCallback(async (email: string) => {
        try {
            const envelopeId = localStorage.getItem(`${email}_docusignEnvelopeId`);
            
            if (!envelopeId) {
                return false;
            }

            const response = await fetch(`http://localhost:4000/api/partner/sign/status?envelopeId=${envelopeId}`);
            const result = await response.json();

            if (result.status === 'completed') {
                localStorage.setItem(`${email}_documentsSigned`, 'true');
                setSigningComplete(true);
                setIsSigning(false);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }, []);

    // Provision partner account
    const provisionPartner = useCallback(async () => {
        try {
            // Get all required data from localStorage
            const kycDataStr = localStorage.getItem(`${userEmail}_kycData`);
            const partnerDataStr = localStorage.getItem(`${userEmail}_partnerData`);
            const kycSessionId = localStorage.getItem(`${userEmail}_applicantId`);
            const docusignEnvelopeId = localStorage.getItem(`${userEmail}_docusignEnvelopeId`);
            
            if (!kycDataStr || !partnerDataStr || !kycSessionId || !docusignEnvelopeId) {
                throw new Error('Missing required data for provisioning');
            }

            const kycData = JSON.parse(kycDataStr);
            const partnerData = JSON.parse(partnerDataStr);

            // Extract first and last name from executiveName
            const nameParts = kycData.executiveName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || nameParts[0];

            const provisionData = {
                email: kycData.email,
                firstName: firstName,
                lastName: lastName,
                company: kycData.companyLegalName,
                website: partnerData.website || '',
                partnerType: partnerData.partnerType,
                kycSessionId: kycSessionId,
                docusignEnvelopeId: docusignEnvelopeId,
                journeyData: {
                    completedAt: new Date().toISOString(),
                    kycData: kycData,
                    partnerData: partnerData,
                },
                addressLine1:kycData.addressLine1 || '',
                city:kycData.city || '',
                country:kycData.country || '',
                postalCode:kycData.postalCode || '',
                province:kycData.province || '',
            };

            const response = await fetch('http://localhost:4000/api/partner/provision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(provisionData),
            });

            const result = await response.json();

            if (result.success) {
                // Store provision result for success page
                localStorage.setItem(`${userEmail}_provisionResult`, JSON.stringify({
                    organizationId: result.organizationId,
                    userId: result.userId,
                    domain: result.domain,
                }));
                return true;
            } else {
                throw new Error(result.errorMessage || 'Failed to provision partner');
            }
        } catch (error) {
            throw error;
        }
    }, [userEmail]);

    useEffect(() => { 
        const initializePage = async () => {
            setIsCheckingStatus(true);
            
            const urlParams = new URLSearchParams(window.location.search);
            const event = urlParams.get('event');
            const urlEmail = urlParams.get('email');
            const urlPartnerType = urlParams.get('partnerType');
            
            
            // Always require both email and partnerType in URL (except when returning from DocuSign)
            if (event !== 'signing_complete' && (!urlEmail || !urlPartnerType)) {
                setErrorMessage('Both email and partnerType are required in the URL. Please provide: ?email=partner@company.com&partnerType=distributor');
                setIsCheckingStatus(false);
                return;
            }
            
            // Try to find email from URL or localStorage
            const result = getKycData(urlEmail, '_kycData');
                        
            if (!result || localStorage.getItem(`${result.email}_kycStatus`) !== 'passed' ) {
                navigate(`/kyc?email=${urlEmail}&partnerType=${urlPartnerType}`);
                // setErrorMessage('KYC data not found. Please complete the KYC verification first.');
                // setIsCheckingStatus(false);
                return;
            }

            // Set state
            setUserEmail(result.email);
            setKycData(result.data);

            // Check if returning from DocuSign or if documents are already signed
            if (event === 'signing_complete' || localStorage.getItem(`${result.email}_documentsSigned`)) {
                await checkEnvelopeStatus(result.email);
                
                // Clean up URL and add parameters
                if (event === 'signing_complete') {
                    const partnerType = result.data.partnerType || '';
                    window.history.replaceState({}, '', `/signing?email=${result.email}&partnerType=${partnerType}`);
                }
            }
            
            setIsCheckingStatus(false);
        };

        initializePage();
    }, [navigate, checkEnvelopeStatus]);

    const handleSign = useCallback(async () => {
        if (!agreedToTerms) {
            setErrorMessage('Please agree to all documents to continue');
            return;
        }

        setIsSigning(true);
        setErrorMessage(null);

        try {
            // Get partner data from localStorage
            const partnerDataStr = localStorage.getItem(`${userEmail}_partnerData`);
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
                localStorage.setItem(`${userEmail}_docusignEnvelopeId`, result.envelopeId);
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
    }, [agreedToTerms, kycData, userEmail]);

    const handleTryAgain = useCallback(() => {
        setErrorMessage(null);
        setIsSigning(false);
        setAgreedToTerms(false);
    }, []);

    const handleContinue = useCallback(async () => {
        // Check if already provisioned
        const provisionResult = localStorage.getItem(`${userEmail}_provisionResult`);
        
        if (provisionResult) {
            navigate(`/success?email=${userEmail}&partnerType=${kycData?.partnerType || ''}`, { replace: true });
            return;
        }

        // Call provision API
        setIsCheckingStatus(true);
        try {
            const result = await provisionPartner();
            if (result) {
                navigate(`/success?email=${userEmail}&partnerType=${kycData?.partnerType || ''}`, { replace: true });
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'Account setup failed. Please contact support.');
        } finally {
            setIsCheckingStatus(false);
        }
    }, [navigate, provisionPartner]);

    const handleCheckboxChange = useCallback((checked: boolean) => {
        setAgreedToTerms(checked);
        if (checked) setErrorMessage(null);
    }, []);

    const handlePreview = useCallback((doc: any) => {
        setPreviewDocument(doc);
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewDocument(null);
    }, []);


    const documents = useMemo(() => {
        // Base documents for all partners
        const baseDocuments = [
            { title: 'WanAware Mutual NDA', description: 'Protects confidential information shared between parties', pages: 8, previewName: "WanAware_Mutual_Non-Disclosure_Agreement(NDA).pdf", type: 'base' },
            { title: 'WanAware Data Processing Addendum', description: 'GDPR/privacy compliance for data handling', pages: 10, previewName: "WanAware_Data_Processing_Addendum.pdf", type: 'base' },
            { title: 'WanAware Master Subscription Agreement', description: 'Defines general terms and conditions of partnership', pages: 12, previewName: "WanAware_Master_Subscription_Agreement.pdf", type: 'base' },
        ];

        // Partner-specific addendums
        const partnerAddendums: Record<string, any> = {
            distributor: { title: 'Distributor Addendum', description: 'Distributor-specific terms, commission structure, and obligations', pages: 6, previewName: "Distributor_Addendum.pdf", type: 'partner' },
            reseller: { title: 'Reseller Addendum', description: 'Reseller-specific terms, commission structure, and obligations', pages: 6, previewName: "Reseller_Addendum.pdf", type: 'partner' },
            // msp: { title: 'Managed Service Provider (MSP) Addendum', description: 'MSP-specific terms, commission structure, and obligations', pages: 6, previewName: "MSP_Addendum.pdf", type: 'partner' },
            // advisor: { title: 'Technology Advisor Addendum', description: 'Advisor-specific terms, commission structure, and obligations', pages: 6, previewName: "Advisor_Addendum.pdf", type: 'partner' },
            // si: { title: 'System Integrator Addendum', description: 'SI-specific terms, commission structure, and obligations', pages: 6, previewName: "SI_Addendum.pdf", type: 'partner' },
        };

        const partnerType = kycData?.partnerType?.toLowerCase() || '';
        const partnerAddendum = partnerAddendums[partnerType];

        return partnerAddendum ? [...baseDocuments, partnerAddendum] : baseDocuments;
    }, [kycData?.partnerType]);

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

                {/* Error Message - shown when there's a parameter or setup error */}
                {errorMessage && !kycData ? (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4 animate-fadeIn">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800">Missing Required Parameters</p>
                            <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
                        </div>
                    </div>
                ) : kycData && (
                    <>
                        {/* Error Message - shown when there's a signing error */}
                        {errorMessage && !signingComplete && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4 animate-fadeIn">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800">Document signing could not be completed</p>
                                    <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
                                </div>
                                <button onClick={handleTryAgain} className="ml-auto px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors">
                                    Try Again
                                </button>
                            </div>
                        )}

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
                            {documents.filter(doc => doc.type === 'base').map((doc) => (
                                <DocumentCard key={doc.title} {...doc} signingComplete={signingComplete} onPreview={() => handlePreview(doc)} />
                            ))}

                            {documents.some(doc => doc.type === 'partner') && (
                                <>
                                    <h2 className="text-sm font-semibold text-slate-600 mt-6 mb-3">PARTNER-SPECIFIC ADDENDUM</h2>
                                    {documents.filter(doc => doc.type === 'partner').map((doc) => (
                                        <div key={doc.title} className={`border rounded-xl p-6 transition-colors ${signingComplete ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200 hover:border-blue-300'}`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-slate-800">{doc.title}</h3>
                                                        {signingComplete && <CheckIcon />}
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                            {kycData.partnerType?.toUpperCase() || 'PARTNER'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-3">{doc.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <DocumentIcon />
                                                        <span>{doc.pages} pages</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handlePreview(doc)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Preview →</button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
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
                                        I have reviewed and agree to all {documents.length} documents listed above on behalf of <strong>{kycData.companyLegalName}</strong>. I confirm that I have the authority to execute these agreements.
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

            {/* Preview Modal */}
            {previewDocument && <PreviewModal document={previewDocument} onClose={handleClosePreview} />}

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

