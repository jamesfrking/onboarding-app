import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createVeriffFrame } from '@veriff/incontext-sdk';

interface KycData {
    email: string;
    companyLegalName: string;
    companyWebsite: string;
    taxId: string;
    executiveName: string;
    executiveTitle: string;
    businessAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface PartnerData {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    partnerType: string;
    goal: string;
    targetSize: string;
    regions: string;
    mspOffers?: string;
    whiteLabelRequired?: string;
}

export default function KycPage() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [kycStatus, setKycStatus] = useState<'pending' | 'verifying' | 'passed' | 'failed'>('pending');
    const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
    const [formData, setFormData] = useState<KycData>({
        email: '',
        companyLegalName: '',
        companyWebsite: '',
        taxId: '',
        executiveName: '',
        executiveTitle: '',
        businessAddress: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
    });

    useEffect(() => {
        const stored = sessionStorage.getItem('partnerData');
        if (stored) {
            const partner: PartnerData = JSON.parse(stored);
            setPartnerData(partner);

            setFormData(prev => ({
                ...prev,
                email: partner.email || '',
                companyLegalName: partner.company || '',
                executiveName: `${partner.firstName || ''} ${partner.lastName || ''}`.trim(),
            }));
        } else {
            // Demo mode: Use sample data instead of redirecting
            const demoPartner: PartnerData = {
                email: 'demo@example.com',
                firstName: 'Demo',
                lastName: 'Partner',
                company: 'Demo Company',
                partnerType: 'msp',
                goal: 'Expand service offerings',
                targetSize: 'SMB',
                regions: 'North America',
            };
            setPartnerData(demoPartner);
            setFormData(prev => ({
                ...prev,
                email: demoPartner.email,
                companyLegalName: demoPartner.company,
                executiveName: `${demoPartner.firstName} ${demoPartner.lastName}`,
            }));
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setKycStatus('verifying');

        try {
            // Use identity verification (what we have access to)
            const response = await fetch('/api/kyc-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success && result.sessionUrl) {
                // Store data for later
                sessionStorage.setItem('kycEmail', formData.email);
                sessionStorage.setItem('kycData', JSON.stringify(formData));

                console.log('Opening Veriff modal with URL:', result.sessionUrl);

                // Open Veriff SDK modal for identity verification
                createVeriffFrame({
                    url: result.sessionUrl,
                    onEvent: (msg: string) => {
                        console.log('Veriff event:', msg);

                        if (msg === 'FINISHED') {
                            console.log('✅ Verification completed!');
                            setKycStatus('passed');
                            setTimeout(() => {
                                navigate('/billing');
                            }, 2000);
                        } else if (msg === 'CANCELED') {
                            console.log('❌ Verification canceled');
                            setKycStatus('failed');
                            setIsSubmitting(false);
                        }
                    }
                });
            } else {
                console.error('Failed to create Veriff session:', result.error);
                setKycStatus('failed');
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error('Verification failed:', error);
            setKycStatus('failed');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-sm">1</div>
                    <div className="w-16 h-1 bg-slate-300"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">2</div>
                    <div className="w-16 h-1 bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">3</div>
                    <div className="w-16 h-1 bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">4</div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Company Verification</h1>
                    <p className="text-slate-500">Tell us about your business</p>
                </div>

                {partnerData && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-slate-500 mb-2">Onboarding Information</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-slate-400">Email:</span>
                                <span className="text-slate-700 ml-2">{partnerData.email}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Partner Type:</span>
                                <span className="text-slate-700 ml-2 capitalize">{partnerData.partnerType || 'MSP'}</span>
                            </div>
                            {partnerData.targetSize && (
                                <div>
                                    <span className="text-slate-400">Target Market:</span>
                                    <span className="text-slate-700 ml-2">{partnerData.targetSize}</span>
                                </div>
                            )}
                            {partnerData.regions && (
                                <div>
                                    <span className="text-slate-400">Regions:</span>
                                    <span className="text-slate-700 ml-2">{partnerData.regions}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {kycStatus === 'verifying' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-700">Verifying your business information...</p>
                    </div>
                )}

                {kycStatus === 'passed' && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-emerald-700">Verification passed! Proceeding to billing...</p>
                    </div>
                )}

                {kycStatus === 'failed' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <p className="text-red-700">Verification failed or canceled. Please try again.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 space-y-6 shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                    <input type="hidden" name="email" value={formData.email} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Legal Name *</label>
                            <input
                                type="text"
                                name="companyLegalName"
                                value={formData.companyLegalName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                placeholder="Acme Corp LLC"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Website</label>
                            <input
                                type="url"
                                name="companyWebsite"
                                value={formData.companyWebsite}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                placeholder="https://example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / EIN</label>
                            <input
                                type="text"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                placeholder="XX-XXXXXXX"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Executive Name *</label>
                            <input
                                type="text"
                                name="executiveName"
                                value={formData.executiveName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                placeholder="Jane Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                            <input
                                type="text"
                                name="executiveTitle"
                                value={formData.executiveTitle}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                placeholder="CEO"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Address *</label>
                            <input
                                type="text"
                                name="businessAddress"
                                value={formData.businessAddress}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                                placeholder="123 Main St, Suite 100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code *</label>
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all"
                            >
                                <option value="US">United States</option>
                                <option value="CA">Canada</option>
                                <option value="GB">United Kingdom</option>
                                <option value="AU">Australia</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Verifying...' : 'Continue to Billing →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
