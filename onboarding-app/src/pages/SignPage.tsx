import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface Document {
    id: string;
    name: string;
    description: string;
    required: boolean;
    status: 'pending' | 'signed';
}

const PARTNER_ADDENDUMS: Record<string, { name: string; description: string }> = {
    msp: {
        name: 'Reseller Addendum',
        description: 'MSP/Reseller program terms, pricing, and commission structure',
    },
    var: {
        name: 'Value Added Reseller Agreement',
        description: 'VAR program terms, support obligations, and revenue sharing',
    },
    distributor: {
        name: 'Distributor Addendum',
        description: 'Distribution rights, territory exclusivity, and volume commitments',
    },
    advisor: {
        name: 'Referral Agreement',
        description: 'Referral program terms and commission payouts',
    },
    si: {
        name: 'System Integrator Addendum',
        description: 'Integration partner terms and project-based compensation',
    },
    referral: {
        name: 'Referral Agreement',
        description: 'Referral program terms and commission payouts',
    },
};

export default function SignPage() {
    const navigate = useNavigate();
    const [signingStatus, setSigningStatus] = useState<'loading' | 'ready' | 'signing' | 'complete'>('loading');
    const [partnerType, setPartnerType] = useState('msp');
    const [companyName, setCompanyName] = useState('');
    const [documents, setDocuments] = useState<Document[]>([]);
    const [currentDocIndex, setCurrentDocIndex] = useState(0);

    useEffect(() => {
        const partnerStored = sessionStorage.getItem('partnerData');
        const kycStored = sessionStorage.getItem('kycData');

        let type = 'msp';
        let company = '';

        if (partnerStored) {
            const data = JSON.parse(partnerStored);
            type = data.partnerType || 'msp';
        }

        if (kycStored) {
            const kyc = JSON.parse(kycStored);
            company = kyc.companyLegalName || '';
        }

        setPartnerType(type);
        setCompanyName(company);

        const addendum = PARTNER_ADDENDUMS[type] || PARTNER_ADDENDUMS.msp;
        const docList: Document[] = [
            {
                id: 'nda',
                name: 'Non-Disclosure Agreement (NDA)',
                description: 'Mutual confidentiality and information protection terms',
                required: true,
                status: 'pending',
            },
            {
                id: 'msa',
                name: 'Master Service Agreement (MSA)',
                description: 'Core platform usage, service terms, and SLA guarantees',
                required: true,
                status: 'pending',
            },
            {
                id: 'addendum',
                name: addendum.name,
                description: addendum.description,
                required: true,
                status: 'pending',
            },
            {
                id: 'aup',
                name: 'Acceptable Use Policy (AUP)',
                description: 'Platform usage guidelines and compliance requirements',
                required: true,
                status: 'pending',
            },
            {
                id: 'dpa',
                name: 'Data Processing Addendum',
                description: 'GDPR/CCPA compliance and data handling procedures',
                required: true,
                status: 'pending',
            },
        ];

        setDocuments(docList);
        setTimeout(() => setSigningStatus('ready'), 1500);
    }, []);

    const handleSignAll = () => {
        setSigningStatus('signing');

        let currentIndex = 0;
        const totalDocs = documents.length;

        const showSpinnerThenSign = () => {
            if (currentIndex >= totalDocs) {
                // All done
                setSigningStatus('complete');
                sessionStorage.setItem('signedAt', new Date().toISOString());
                sessionStorage.setItem('signedDocuments', JSON.stringify(documents.map(d => d.id)));
                setTimeout(() => navigate('/success'), 1500);
                return;
            }

            // Step 1: Show spinner on current document
            setCurrentDocIndex(currentIndex);

            // Step 2: After delay, mark as signed
            setTimeout(() => {
                const indexToSign = currentIndex;
                setDocuments(prev =>
                    prev.map((doc, i) =>
                        i === indexToSign ? { ...doc, status: 'signed' } : doc
                    )
                );

                // Step 3: Move to next document after brief pause
                currentIndex++;
                setTimeout(showSpinnerThenSign, 150);
            }, 500);
        };

        // Start the signing sequence
        showSpinnerThenSign();
    };

    const getDocumentIcon = (docId: string) => {
        switch (docId) {
            case 'nda':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                );
            case 'msa':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                );
            case 'aup':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                );
            case 'dpa':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                );
            default:
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                );
        }
    };

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="w-16 h-1 bg-emerald-500"></div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="w-16 h-1 bg-emerald-500"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-sm">3</div>
                    <div className="w-16 h-1 bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">4</div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Sign Agreements</h1>
                    <p className="text-slate-500">Review and sign your partner agreements</p>
                    {companyName && (
                        <p className="text-sm text-slate-600 mt-2">Signing on behalf of: {companyName}</p>
                    )}
                </div>

                {signingStatus === 'loading' && (
                    <div className="bg-white/95 border border-slate-200 rounded-2xl p-8 text-center shadow-lg">
                        <div className="w-12 h-12 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">Preparing your document package...</p>
                    </div>
                )}

                {signingStatus === 'ready' && (
                    <div className="space-y-4">
                        <div className="bg-white/95 border border-slate-200 rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-800">Document Package</h2>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded capitalize">
                                    {partnerType} Partner
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">
                                Please review and sign the following {documents.length} documents to complete your partner enrollment:
                            </p>

                            <div className="space-y-3">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {getDocumentIcon(doc.id)}
                                            </svg>
                                            <div>
                                                <p className="text-slate-800 font-medium">{doc.name}</p>
                                                <p className="text-sm text-slate-500">{doc.description}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 uppercase">
                                            {doc.required ? 'Required' : 'Optional'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <p className="text-amber-700 font-medium text-sm">Important</p>
                                    <p className="text-slate-600 text-sm">
                                        By clicking "Sign All Documents", you acknowledge that you have read and agree to all terms.
                                        This creates a legally binding electronic signature.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSignAll}
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transition-all duration-300 shadow-lg"
                        >
                            Review & Sign All Documents →
                        </button>

                        <p className="text-center text-slate-500 text-xs">
                            Powered by DocuSign. Documents are legally binding electronic signatures.
                        </p>
                    </div>
                )}

                {signingStatus === 'signing' && (
                    <div className="bg-white/95 border border-slate-200 rounded-2xl p-8 shadow-lg">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-600">Processing your signatures...</p>
                            <p className="text-sm text-slate-500 mt-2">
                                Signing document {Math.min(currentDocIndex + 1, documents.length)} of {documents.length}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {documents.map((doc, index) => (
                                <div
                                    key={doc.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                                        doc.status === 'signed'
                                            ? 'bg-emerald-50 border border-emerald-200'
                                            : index === currentDocIndex
                                                ? 'bg-slate-100 border border-slate-300'
                                                : 'bg-slate-50 border border-slate-200'
                                    }`}
                                >
                                    {doc.status === 'signed' ? (
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : index === currentDocIndex ? (
                                        <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <div className="w-5 h-5 border-2 border-slate-300 rounded-full"></div>
                                    )}
                                    <span className={doc.status === 'signed' ? 'text-emerald-700' : 'text-slate-600'}>
                                        {doc.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {signingStatus === 'complete' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-lg">
                        <svg className="w-16 h-16 text-emerald-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <h2 className="text-xl font-semibold text-emerald-700 mb-2">All Documents Signed!</h2>
                        <p className="text-slate-600">Provisioning your partner account...</p>
                        <p className="text-sm text-slate-500 mt-2">
                            {documents.length} documents signed successfully
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
