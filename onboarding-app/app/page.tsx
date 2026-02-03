'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function RedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Preserve any query params when redirecting
        const email = searchParams.get('email');
        if (email) {
            router.replace(`/start?email=${encodeURIComponent(email)}`);
        } else {
            router.replace('/start');
        }
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Redirecting to onboarding...</p>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        }>
            <RedirectContent />
        </Suspense>
    );
}
