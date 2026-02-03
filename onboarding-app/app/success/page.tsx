'use client';

import { useEffect, useState } from 'react';

export default function SuccessPage() {
    const [provisioned, setProvisioned] = useState(false);
    const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(null);

    useEffect(() => {
        // Simulate backend provisioning
        const provisionAccount = async () => {
            // In production: Call /api/provision to:
            // 1. Create Auth0 user
            // 2. Create tenant in UAS
            // 3. Send welcome email

            try {
                const partnerData = sessionStorage.getItem('partnerData');
                const kycData = sessionStorage.getItem('kycData');

                await fetch('/api/provision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partner: partnerData ? JSON.parse(partnerData) : {},
                        kyc: kycData ? JSON.parse(kycData) : {},
                    }),
                });
            } catch {
                // Demo mode
            }

            // Simulate provisioning delay
            setTimeout(() => {
                const stored = sessionStorage.getItem('partnerData');
                const email = stored ? JSON.parse(stored).email : 'partner@example.com';

                setCredentials({
                    email,
                    tempPassword: 'Check your email for login link',
                });
                setProvisioned(true);
            }, 2000);
        };

        provisionAccount();
    }, []);

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-2xl mx-auto">
                {/* Progress bar - complete */}
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
                </div>

                {!provisioned ? (
                    <div className="bg-white/95 border border-slate-200 rounded-2xl p-8 text-center shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                        <div className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Provisioning Your Account</h2>
                        <p className="text-slate-500">Creating your partner portal and credentials...</p>

                        <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Creating Auth0 user...</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                                <span>Building tenant...</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                                <span>Sending welcome email...</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center shadow-lg">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Wanaware!</h1>
                            <p className="text-emerald-700">Your partner account has been created successfully.</p>
                        </div>

                        {credentials && (
                            <div className="bg-white/95 border border-slate-200 rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                                <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Account Details</h2>

                                <div className="space-y-3">
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-sm text-slate-500 mb-1">Login Email</p>
                                        <p className="text-slate-800 font-mono">{credentials.email}</p>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-sm text-slate-500 mb-1">Password</p>
                                        <p className="text-slate-700">{credentials.tempPassword}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white/95 border border-slate-200 rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4">What&apos;s Next?</h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                                    <div>
                                        <p className="text-slate-800 font-medium">Check your email</p>
                                        <p className="text-sm text-slate-500">You&apos;ll receive a link to set your password</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                                    <div>
                                        <p className="text-slate-800 font-medium">Log in to your partner portal</p>
                                        <p className="text-sm text-slate-500">Access training materials and resources</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                                    <div>
                                        <p className="text-slate-800 font-medium">Start onboarding customers</p>
                                        <p className="text-sm text-slate-500">Begin adding your first customers within 5 minutes</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <a
                            href="https://app.wanaware.com"
                            className="block w-full py-3.5 px-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 hover:shadow-xl transition-all duration-300 shadow-lg text-center"
                        >
                            Go to Partner Portal →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
