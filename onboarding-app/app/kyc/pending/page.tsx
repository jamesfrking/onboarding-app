'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function KycPendingPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'pending' | 'verifying' | 'approved' | 'declined' | 'manual'>('pending');
    const [email, setEmail] = useState<string | null>(null);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        // Get email from session storage
        const storedEmail = sessionStorage.getItem('kycEmail');
        if (!storedEmail) {
            // No email found, redirect back to KYC page
            router.push('/kyc');
            return;
        }
        setEmail(storedEmail);

        // Since we don't have backend status endpoint yet,
        // show manual verification message after 5 seconds
        const timer = setTimeout(() => {
            setStatus('manual');
            setMessage('Your verification has been submitted. Please check back or contact support for status.');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    // Manual approve button (for testing)
    const handleManualApprove = () => {
        setStatus('approved');
        setTimeout(() => {
            router.push('/billing');
        }, 2000);
    };

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-2xl mx-auto">
                {/* Progress bar */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-sm">1</div>
                    <div className="w-16 h-1 bg-slate-300"></div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-sm">2</div>
                    <div className="w-16 h-1 bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">3</div>
                    <div className="w-16 h-1 bg-slate-200"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">4</div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Identity Verification</h1>
                    <p className="text-slate-500">Checking your verification status...</p>
                </div>

                {/* Status Cards */}
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>

                    {status === 'pending' && (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-700 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500">Loading...</p>
                        </div>
                    )}

                    {status === 'verifying' && (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Verifying Your Identity</h2>
                            <p className="text-slate-500 mb-4">
                                We're processing your verification. This typically takes 2-5 minutes.
                            </p>
                            <p className="text-sm text-slate-400">
                                Please don't close this window. You'll be redirected automatically.
                            </p>
                        </div>
                    )}

                    {status === 'approved' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-emerald-700 mb-2">Verification Approved!</h2>
                            <p className="text-slate-600">
                                Your identity has been verified. Redirecting to billing...
                            </p>
                        </div>
                    )}

                    {status === 'declined' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-red-700 mb-2">Verification Could Not Be Completed</h2>
                            <p className="text-slate-600 mb-6">
                                We were unable to verify your identity. Please contact support for assistance.
                            </p>
                            <button
                                onClick={() => router.push('/kyc')}
                                className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {status === 'manual' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-blue-700 mb-2">Verification Submitted</h2>
                            <p className="text-slate-600 mb-6">
                                {message || 'Your verification has been submitted and is being reviewed.'}
                            </p>

                            {/* Test button to manually approve and continue */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleManualApprove}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-emerald-600 transition-all duration-300"
                                >
                                    ✅ Approve & Continue to Billing (Test)
                                </button>
                                <button
                                    onClick={() => router.push('/kyc')}
                                    className="w-full px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all duration-300"
                                >
                                    Back to KYC
                                </button>
                            </div>

                            <p className="text-xs text-slate-400 mt-4">
                                💡 Testing mode: Click "Approve & Continue" to proceed without waiting for Veriff webhook
                            </p>
                        </div>
                    )}
                </div>

                {/* Debug info */}
                {email && (
                    <div className="mt-4 text-center text-xs text-slate-400">
                        Verification for: {email}
                    </div>
                )}

                <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500">
                        Check <a href="https://station.veriff.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Veriff Dashboard</a> for verification status
                    </p>
                </div>
            </div>
        </div>
    );
}
