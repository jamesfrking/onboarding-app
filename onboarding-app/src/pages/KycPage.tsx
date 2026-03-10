import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import SumsubWebSdk from '@sumsub/websdk-react';
import { COUNTRIES } from '../constants/countries';
import { getKycData } from '../utils/kycUtils';
import API_ENDPOINTS from '../config/api';

interface KycData {
    email: string;
    companyLegalName: string;
    companyWebsite: string;
    taxId: string;
    executiveName: string;
    executiveTitle: string;
    addressLine1: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    partnerType?: string;
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
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [suggestionsPlaceholder, setSuggestionsPlaceholder] = useState('Start Typing to get Suggestions');
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const addressInputRef = useRef<HTMLInputElement>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState<KycData>({
        email: '',
        companyLegalName: '',
        companyWebsite: '',
        taxId: '',
        executiveName: '',
        executiveTitle: '',
        addressLine1: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
        partnerType: '',
    });

    // Get Smarty API key from environment
    const smartyAPIKey = '185996570711731822';

    useEffect(() => {
        const initializePage = async () => {
            setIsCheckingStatus(true);
            
            const params = new URLSearchParams(window.location.search);
            const urlEmail = params.get('email');
            const urlPartnerType = params.get('partnerType');
            
            // Always require both email and partnerType in URL
            if (!urlEmail || !urlPartnerType) {
                setErrorMessage('Both email and partnerType are required in the URL. Please provide: ?email=partner@company.com&partnerType=msp');
                setIsCheckingStatus(false);
                return;
            }

            let partnerInfo: PartnerData | null = null;

            const stored = localStorage.getItem(`${urlEmail}_partnerData`);
            
            if (stored) {
                partnerInfo = JSON.parse(stored);
            } else {
                // Create new partner data from URL params
                partnerInfo = {
                    email: urlEmail,
                    firstName: params.get('firstName') || '',
                    lastName: params.get('lastName') || '',
                    company: params.get('company') || '',
                    partnerType: urlPartnerType,
                    goal: params.get('goal') || '',
                    targetSize: params.get('targetSize') || '',
                    regions: params.get('regions') || '',
                    mspOffers: params.get('mspOffers') || '',
                    whiteLabelRequired: params.get('whiteLabelRequired') || ''
                };
                localStorage.setItem(`${urlEmail}_partnerData`, JSON.stringify(partnerInfo));
            }

            // Set partner data and form data
            if (partnerInfo) {
                setPartnerData(partnerInfo);
                setFormData(prev => ({
                    ...prev,
                    email: partnerInfo.email,
                    companyLegalName: partnerInfo.company,
                    executiveName: `${partnerInfo.firstName} ${partnerInfo.lastName}`.trim(),
                    partnerType: partnerInfo.partnerType,
                }));
            }

            // Check KYC status using getKycData utility
            const kycResult = getKycData(urlEmail, '_kycData');
            if (kycResult) {
                const applicantId = localStorage.getItem(`${kycResult.email}_applicantId`);
                
                if (applicantId) {
                    const res = await fetch(`http://localhost:4000/api/partner/kyc/status?applicantId=${applicantId}`);
                    const data = await res.json();
                    
                    if (data.status === 'completed') {
                        navigate(`/signing?email=${kycResult?.email}&partnerType=${partnerInfo?.partnerType}`);
                        return;
                    }
                }
            }

            setIsCheckingStatus(false);
        };

        initializePage();
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Reset address fields when country changes
        if (name === 'country') {
            setFormData(prev => ({
                ...prev,
                addressLine1: '',
                city: '',
                province: '',
                postalCode: '',
            }));
            setAddressSuggestions([]);
            setSuggestionsPlaceholder('Start Typing to get Suggestions');
            setShowAddressDropdown(false);
        }
    };

    const fetchAddressSuggestions = async (search: string) => {
        if (!formData.country || !search || search.length < 1) {
            setAddressSuggestions([]);
            setShowAddressDropdown(false);
            return;
        }
        
        try {
            const url = formData.country === 'USA'
                ? `https://us-autocomplete-pro.api.smartystreets.com/lookup?key=${smartyAPIKey}&search=${encodeURIComponent(search)}&prefer_geolocation=none`
                : `https://international-autocomplete.api.smarty.com/v2/lookup?key=${smartyAPIKey}&country=${formData.country}&search=${encodeURIComponent(search)}`;
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                const suggestions = formData.country === 'USA' ? data.suggestions || [] : data.candidates || [];
                setAddressSuggestions(suggestions);
                setShowAddressDropdown(suggestions.length > 0);
            }
        } catch (error) {
            setShowAddressDropdown(false);
        }
    };

    const handleAddressSelection = async (selection: any) => {
        if (formData.country === 'USA') {
            // Handle US address selection
            setFormData(prev => ({
                ...prev,
                addressLine1: selection.addr1,
                city: selection.locality,
                province: selection.state,
                postalCode: selection.zip,
            }));
            
            try {
                await fetch('http://localhost:4000/api/partner/verify/us-address', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address1: selection.addr1,
                        locality: selection.locality,
                        state: selection.state,
                    }),
                });
            } catch (error) {
            }
            
            // Don't clear suggestions - keep them for user to change if needed
            setShowAddressDropdown(false);
            setSuggestionsPlaceholder('Start Typing to get Suggestions');
            // Remove focus from input
            addressInputRef.current?.blur();
        } else if (selection.value > 1) {
            // Handle multi-entry address selection - fetch more specific addresses
            try {
                const response = await fetch(
                    `https://international-autocomplete.api.smarty.com/v2/lookup/${selection.address_id}?country=${formData.country}&key=${smartyAPIKey}`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    setAddressSuggestions(data.candidates || []);
                    setSuggestionsPlaceholder(`Click to select from ${data.candidates.length} Local Addresses`);
                    // Clear the input to show placeholder
                    setFormData(prev => ({ ...prev, addressLine1: '' }));
                    setShowAddressDropdown(false);
                    // Remove focus from input
                    addressInputRef.current?.blur();
                }
            } catch (error) {
                setShowAddressDropdown(false);
            }
        } else {
            // Handle single address selection
            try {
                const response = await fetch(
                    `https://international-autocomplete.api.smarty.com/v2/lookup/${selection.address_id}?country=${formData.country}&key=${smartyAPIKey}`
                );
                
                if (response.ok) {
                    const { candidates } = await response.json();
                    const candidate = candidates[0];
                    
                    setFormData(prev => ({
                        ...prev,
                        addressLine1: candidate.street || '',
                        city: candidate.locality || '',
                        province: candidate.administrative_area || '',
                        postalCode: candidate.postal_code || '',
                    }));
                    
                    try {
                        await fetch('http://localhost:4000/api/partner/kyc/address-coordinates', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                address1: candidate.street,
                                locality: candidate.locality,
                                administrative_area: candidate.administrative_area,
                                postal_code: candidate.postal_code,
                                country: formData.country,
                            }),
                        });
                    } catch (error) {

                    }
                    
                    // Don't clear suggestions - keep them available
                    setShowAddressDropdown(false);
                    setSuggestionsPlaceholder('Start Typing to get Suggestions');
                    // Remove focus from input
                    addressInputRef.current?.blur();
                }
            } catch (error) {
                setShowAddressDropdown(false);
            }
        }
    };

    const getAddressOptions = () => {
        if (!addressSuggestions.length) {
            return [{ label: 'Start Typing to get Suggestions', value: '', disabled: true }];
        }

        if (formData.country === 'USA') {
            return addressSuggestions.map((addr: any) => ({
                label: `${addr.street_line}${addr.secondary ? ', ' + addr.secondary : ''}, ${addr.city}`,
                value: addr.street_line,
                addr1: addr.street_line,
                locality: addr.city,
                zip: addr.zipcode,
                state: addr.state,
                disabled: false,
            }));
        }

        return addressSuggestions.map((addr: any) => ({
            label: addr.address_text,
            value: addr.entries,
            address_id: addr.address_id,
            disabled: false,
        }));
    };

    const accessTokenExpirationHandler = async () => {
        const response = await fetch(API_ENDPOINTS.KYC_CREATE_SESSION, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        
        if (result.success || result.token) {
            return result.token;
        }
        throw new Error('Failed to refresh access token');
    };

    const handleSumsubMessage = (type: string, payload: any) => {
        if(type === 'idCheck.onApplicantLoaded'){
            if (formData.email) {
                localStorage.setItem(`${formData.email}_applicantId`, payload.applicantId);
            }
        }

        if (type === 'idCheck.onApplicantSubmitted') {
            setKycStatus('passed');
            setTimeout(() => {
                localStorage.setItem(`${formData.email}_kycStatus`, 'passed');
                navigate(`/signing?email=${formData.email}&partnerType=${formData.partnerType}`);
            }, 2500);
        }
    };

    const handleSumsubError = (error: any) => {
        setKycStatus('failed');
        setIsSubmitting(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setKycStatus('verifying');

        // Split executive name
        const nameParts = formData.executiveName.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Unknown';

        try {
            const response = await fetch(API_ENDPOINTS.KYC_CREATE_SESSION, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, firstName, lastName }),
            });

            const result = await response.json();

            if (result.success || result.token) {
                // Store with email-prefixed keys
                localStorage.setItem(`${formData.email}_kycData`, JSON.stringify(formData));
                setAccessToken(result.token);
                setKycStatus('pending');
            } else {
                setKycStatus('failed');
                setIsSubmitting(false);
            }
        } catch (error) {
            setKycStatus('failed');
            setIsSubmitting(false);
        }
    };

    const steps = [
        { num: 1, label: 'Company Info', active: !accessToken },
        { num: 2, label: 'Identity Verification', active: !!accessToken },
        { num: 3, label: 'Document Signing' },
        { num: 4, label: 'Account Setup' },
    ];

     // Show loading while checking status
    if (isCheckingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Verifying KYC status...</p>
                    <p className="text-xs text-slate-400 mt-2">Please wait</p>
                </div>
            </div>
        );
    }

    
    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            {/* Top bar */}
            <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <img
                        src="/assets/wanaware-logo.png"
                        alt="WanAware"
                        className="h-5 w-auto"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <span className="text-xs text-slate-400 font-medium">Partner Onboarding</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="max-w-4xl mx-auto px-6 pt-8 pb-2">
                <div className="flex items-center gap-1">
                    {steps.map((step, i) => (
                        <div key={step.num} className="flex items-center flex-1">
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                                <div className={`
                                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-500
                                    ${step.num < 2 || (step.num === 2 && accessToken)
                                        ? 'bg-slate-800 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-400 border border-slate-200'}
                                `}>
                                    {step.num < 2 && accessToken ? (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : step.num}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block transition-colors ${step.active ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className="flex-1 mx-3">
                                    <div className="h-px bg-slate-200 relative">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-slate-800 transition-all duration-700"
                                            style={{ width: step.num < 2 ? '100%' : '0%' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

             {errorMessage ? ( 
                <div className="max-w-4xl mx-auto px-6 py-8">
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
                </div>
            ) : (
                <>
                    {/* Main content */}
                    <div className="max-w-4xl mx-auto px-6 py-8">

                        {/* Verification modal overlay */}
                        {accessToken && kycStatus !== 'failed' && (
                            <div className="fixed inset-0 z-50 animate-fadeIn">
                                {/* Backdrop */}
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                                {/* Modal */}
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn">
                                        {/* Modal header */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-semibold text-slate-800">Identity Verification</h2>
                                                    <p className="text-xs text-slate-400">Complete the steps below to continue</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setAccessToken(null);
                                                    setKycStatus('pending');
                                                    setIsSubmitting(false);
                                                }}
                                                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* SDK container - scrollable */}
                                        <div className="flex-1 overflow-y-auto">
                                            <SumsubWebSdk
                                                accessToken={accessToken}
                                                expirationHandler={accessTokenExpirationHandler}
                                                config={{
                                                    lang: 'en',
                                                    theme: 'light',
                                                }}
                                                options={{
                                                    addViewportTag: false,
                                                    adaptIframeHeight: true,
                                                }}
                                                onMessage={handleSumsubMessage}
                                                onError={handleSumsubError}
                                            />
                                        </div>

                                        {/* Modal footer */}
                                        <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-slate-100 flex-shrink-0">
                                            <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span className="text-[11px] text-slate-400">Secured by Sumsub &middot; Encrypted &middot; GDPR compliant</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success banner */}
                        {kycStatus === 'passed' && (
                            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4 animate-fadeIn">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">Verification submitted successfully</p>
                                    <p className="text-xs text-emerald-600 mt-0.5">Redirecting to document signing...</p>
                                </div>
                                <div className="ml-auto">
                                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            </div>
                        )}

                        {/* Error banner */}
                        {kycStatus === 'failed' && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4 animate-fadeIn">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-red-800">Verification could not be completed</p>
                                    <p className="text-xs text-red-600 mt-0.5">Something went wrong. Please try again.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setAccessToken(null);
                                        setKycStatus('pending');
                                        setIsSubmitting(false);
                                    }}
                                    className="ml-auto px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Form view */}
                        {!accessToken && kycStatus !== 'failed' && (
                            <div className="max-w-2xl mx-auto animate-fadeIn">
                                <div className="text-center mb-8">
                                    <h1 className="text-2xl font-semibold text-slate-800">Company Verification</h1>
                                    <p className="text-slate-500 text-sm mt-2">Tell us about your business to get started</p>
                                </div>

                                {partnerData && (
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-700 mb-1.5">Onboarding Details</p>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                                <div className="flex gap-1.5">
                                                    <span className="text-slate-400">Email:</span>
                                                    <span className="text-slate-600">{partnerData.email}</span>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <span className="text-slate-400">Type:</span>
                                                    <span className="text-slate-600 capitalize">{partnerData.partnerType || 'MSP'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="p-6 space-y-5">
                                        <input type="hidden" name="email" value={formData.email} />

                                        {/* Company section */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Company Information</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Legal Name *</label>
                                                    <input type="text" name="companyLegalName" value={formData.companyLegalName} onChange={handleChange} required
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                                                        placeholder="Acme Corp LLC" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                                                    <input type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                                                        placeholder="https://example.com" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID / EIN</label>
                                                    <input type="text" name="taxId" value={formData.taxId} onChange={handleChange}
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                                                        placeholder="XX-XXXXXXX" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100" />

                                        {/* Executive section */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Executive Details</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                                    <input type="text" name="executiveName" value={formData.executiveName} onChange={handleChange} required
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                                                        placeholder="Jane Doe" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                                                    <input type="text" name="executiveTitle" value={formData.executiveTitle} onChange={handleChange} required
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                                                        placeholder="CEO" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100" />

                                        {/* Address section */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Business Address</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Country */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Country <span className="text-red-400">*</span>
                                                    </label>
                                                    <select
                                                        name="country"
                                                        value={formData.country}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                                                    >
                                                        <option value="">Select Country</option>
                                                        {Object.keys(COUNTRIES).sort().map((countryName) => (
                                                            <option key={COUNTRIES[countryName]} value={COUNTRIES[countryName]}>
                                                                {countryName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Street Address - Input with Dropdown */}
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Street Address <span className="text-red-400">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            ref={addressInputRef}
                                                            type="text"
                                                            value={formData.addressLine1}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setFormData(prev => ({ ...prev, addressLine1: value }));
                                                                if (suggestionsPlaceholder.includes('Local Addresses')) {
                                                                    setSuggestionsPlaceholder('Start Typing to get Suggestions');
                                                                }
                                                                fetchAddressSuggestions(value);
                                                            }}
                                                            onFocus={() => addressSuggestions.length > 0 && setShowAddressDropdown(true)}
                                                            onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
                                                            disabled={!formData.country}
                                                            required
                                                            autoComplete="off"
                                                            placeholder={formData.country ? suggestionsPlaceholder : "Select a country first"}
                                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                                                        />
                                                        
                                                        {/* Show suggestions dropdown */}
                                                        {showAddressDropdown && addressSuggestions.length > 0 && formData.country && (
                                                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                                {getAddressOptions().map((option: any, index: number) => (
                                                                    !option.disabled && (
                                                                        <button
                                                                            key={index}
                                                                            type="button"
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                handleAddressSelection(option);
                                                                            }}
                                                                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 focus:outline-none focus:bg-slate-50 text-sm text-slate-800"
                                                                        >
                                                                            {option.label}
                                                                            {option.value > 1 && (
                                                                                <span className="text-xs text-slate-500 ml-2">
                                                                                    ({option.value} addresses)
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    )
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* City */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        City <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleChange}
                                                        required
                                                        disabled
                                                        placeholder="City"
                                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm cursor-not-allowed"
                                                    />
                                                </div>

                                                {/* State/Province */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        State/Province <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="province"
                                                        value={formData.province}
                                                        onChange={handleChange}
                                                        required
                                                        disabled
                                                        placeholder="State/Province"
                                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm cursor-not-allowed"
                                                    />
                                                </div>

                                                {/* ZIP/Postal Code */}
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Postal Code <span className="text-red-400">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="postalCode"
                                                        value={formData.postalCode}
                                                        onChange={handleChange}
                                                        required
                                                        disabled
                                                        placeholder="Postal Code"
                                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit button - sits at bottom of card */}
                                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-3 px-6 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 active:bg-slate-900 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Initializing Verification...
                                                </>
                                            ) : (
                                                <>
                                                    Continue to Identity Verification
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    
                                </form>

                                <p className="text-xs text-slate-400 text-center mt-6">
                                    Your information is encrypted and securely transmitted. We use industry-standard verification to protect your identity.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleIn {
                    animation: scaleIn 0.25s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
