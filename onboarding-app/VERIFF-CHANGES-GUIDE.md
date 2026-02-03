# Onboarding App - Veriff Integration Changes

## Overview
3 files need to be updated in the onboarding-app to integrate with Veriff KYC.

---

## Change #1: Update KYC API Route

**File:** `app/api/kyc/route.ts`

**What's changing:**
- Old: Calls `/api/partner-onboarding/kyc` (mock endpoint)
- New: Calls `/partner/api/kyc/create-session` (Veriff integration)
- Returns `verificationUrl` instead of simple success/fail

**Replace the entire file with:**

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PORTAL_BACKEND_URL = process.env.PORTAL_BACKEND_URL || 'https://api.wanaware.com';

// POST /api/kyc
// Creates Veriff session and returns verification URL
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            email,
            companyLegalName,
            companyWebsite,
            taxId,
            executiveName,
            executiveTitle,
            businessAddress,
            city,
            state,
            zipCode,
            country,
        } = body;

        // Validate required fields
        if (!email || !companyLegalName || !executiveName || !businessAddress) {
            return NextResponse.json(
                { error: 'Missing required fields: email, companyLegalName, executiveName, businessAddress' },
                { status: 400 }
            );
        }

        // Call backend to create Veriff session
        const response = await fetch(
            `${PORTAL_BACKEND_URL}/partner/api/kyc/create-session`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    companyLegalName,
                    taxId,
                    executiveName,
                    executiveTitle,
                    address: {
                        street: businessAddress,
                        city,
                        state,
                        zip: zipCode,
                        country
                    }
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    success: false,
                    error: errorData.message || 'Failed to create KYC session'
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return Veriff URL to frontend
        return NextResponse.json({
            success: true,
            verificationUrl: data.verificationUrl,
            sessionId: data.sessionId
        });
    } catch (error) {
        console.error('KYC session creation failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to initiate KYC verification'
            },
            { status: 500 }
        );
    }
}
```

**Key changes:**
- ✅ Calls `/partner/api/kyc/create-session` (new endpoint)
- ✅ Returns `verificationUrl` and `sessionId`
- ✅ Sends address as nested object (matches Veriff format)

---

## Change #2: Update KYC Page to Redirect to Veriff

**File:** `app/kyc/page.tsx`

**What's changing:**
- Old: Shows fake "verifying" status, then redirects to /billing
- New: Redirects user to Veriff URL for identity verification

**Replace the `handleSubmit` function (lines 77-106) with:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setKycStatus('verifying');

    try {
        // Call KYC API to create Veriff session
        const response = await fetch('/api/kyc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success && result.verificationUrl) {
            // Store email for status checking later
            sessionStorage.setItem('kycEmail', formData.email);
            sessionStorage.setItem('kycData', JSON.stringify(formData));

            // Redirect to Veriff for identity verification
            window.location.href = result.verificationUrl;
        } else {
            setKycStatus('failed');
            setIsSubmitting(false);
        }
    } catch (error) {
        console.error('KYC session creation failed:', error);
        setKycStatus('failed');
        setIsSubmitting(false);
    }
};
```

**Key changes:**
- ✅ Saves email to sessionStorage (needed for status polling)
- ✅ Redirects to `result.verificationUrl` (Veriff page)
- ✅ Removes demo mode auto-pass (lines 99-102)

**Full file after changes:**
- Lines 1-76: Keep as-is (imports, state, useEffect, handleChange)
- Lines 77-106: Replace with new `handleSubmit` above
- Lines 107-326: Keep as-is (JSX rendering)

---

## Change #3: Create Pending Page (NEW FILE)

**File:** `app/kyc/pending/page.tsx` (create new file)

**Purpose:** User lands here after completing Veriff verification. Polls backend for status.

**Create this new file:**

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const PORTAL_BACKEND_URL = process.env.NEXT_PUBLIC_PORTAL_BACKEND_URL || 'https://api.wanaware.com';

export default function KycPendingPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'pending' | 'verifying' | 'approved' | 'declined' | 'error'>('pending');
    const [email, setEmail] = useState<string | null>(null);

    useEffect(() => {
        // Get email from session storage
        const storedEmail = sessionStorage.getItem('kycEmail');
        if (!storedEmail) {
            // No email found, redirect back to KYC page
            router.push('/kyc');
            return;
        }
        setEmail(storedEmail);

        // Start polling for KYC status
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(
                    `${PORTAL_BACKEND_URL}/partner/api/kyc/status?email=${encodeURIComponent(storedEmail)}`
                );

                if (response.ok) {
                    const data = await response.json();

                    if (data.kycStatus === 'approved') {
                        setStatus('approved');
                        clearInterval(pollInterval);

                        // Proceed to billing after 2 seconds
                        setTimeout(() => {
                            router.push('/billing');
                        }, 2000);
                    } else if (data.kycStatus === 'declined') {
                        setStatus('declined');
                        clearInterval(pollInterval);
                    } else {
                        setStatus('verifying');
                    }
                }
            } catch (error) {
                console.error('Status check failed:', error);
                setStatus('error');
            }
        }, 3000); // Poll every 3 seconds

        // Cleanup on unmount
        return () => clearInterval(pollInterval);
    }, [router]);

    return (
        <div className="min-h-screen py-12 px-6" style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
            <div className="max-w-2xl mx-auto">
                {/* Progress bar */}
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
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Identity Verification</h1>
                    <p className="text-slate-500">Checking your verification status...</p>
                </div>

                {/* Status Cards */}
                <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 50px -12px rgba(0, 0, 0, 0.15)' }}>

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

                    {status === 'error' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-amber-700 mb-2">Connection Error</h2>
                            <p className="text-slate-600 mb-6">
                                We're having trouble checking your verification status. Please try again.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {status === 'pending' && (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-700 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-500">Loading...</p>
                        </div>
                    )}
                </div>

                {/* Debug info (remove in production) */}
                {email && (
                    <div className="mt-4 text-center text-xs text-slate-400">
                        Checking status for: {email}
                    </div>
                )}
            </div>
        </div>
    );
}
```

**What this page does:**
1. Gets email from sessionStorage
2. Polls `/partner/api/kyc/status?email=xxx` every 3 seconds
3. Shows spinner while `verifying`
4. Shows success checkmark when `approved` → redirects to `/billing`
5. Shows error if `declined` → allows retry

---

## Change #4: Update Veriff Callback Configuration

**File:** `app/kyc/page.tsx` (one more small change)

Veriff needs to know where to redirect the user after verification. Update the Veriff return URL:

**In Veriff Dashboard:**
- Set **Success redirect URL:** `https://onboarding.wanaware.com/kyc/pending`
- Set **Decline redirect URL:** `https://onboarding.wanaware.com/kyc/pending`

OR

**Pass in createSession backend code:**
```javascript
// In portal-backend-dev veriff.service.js
verification: {
  callback: `${process.env.BACKEND_BASE_URL}/partner/api/kyc/webhook`,
  // Add this:
  returnUrl: 'https://onboarding.wanaware.com/kyc/pending'
}
```

---

## Change #5: Environment Variables

**File:** `one pager/onboarding-app/.env.local`

Add or update:

```env
# Portal Backend URL
PORTAL_BACKEND_URL=http://localhost:3001
# OR for production:
# PORTAL_BACKEND_URL=https://api.wanaware.com

# Public env var for client-side API calls
NEXT_PUBLIC_PORTAL_BACKEND_URL=http://localhost:3001
# OR for production:
# NEXT_PUBLIC_PORTAL_BACKEND_URL=https://api.wanaware.com
```

**Why both?**
- `PORTAL_BACKEND_URL` - Used in API routes (server-side)
- `NEXT_PUBLIC_PORTAL_BACKEND_URL` - Used in pending page (client-side)

---

## Summary of Changes

| File | Action | Lines Changed |
|------|--------|---------------|
| `app/api/kyc/route.ts` | Replace entire file | ~70 lines |
| `app/kyc/page.tsx` | Replace `handleSubmit` function | ~30 lines (lines 77-106) |
| `app/kyc/pending/page.tsx` | Create new file | ~150 lines |
| `.env.local` | Add variables | 2 lines |

**Total:** 3 files modified, 1 file created, ~250 lines changed

---

## Testing Checklist

After making these changes:

1. **Start onboarding app:**
   ```bash
   cd "one pager/onboarding-app"
   npm run dev
   ```

2. **Test KYC flow:**
   - Go to `/kyc` page
   - Fill out form
   - Click "Continue to Billing"
   - Should redirect to Veriff URL (https://magic.veriff.me/v/...)
   - Complete Veriff verification (upload ID, take selfie)
   - Should redirect back to `/kyc/pending`
   - Should show "Verifying..." spinner
   - Should show "Approved!" after ~2-5 minutes
   - Should auto-redirect to `/billing`

3. **Check browser console:**
   - No errors during form submission
   - Veriff URL appears in console logs
   - Status polling logs show in console

4. **Check sessionStorage:**
   - Open DevTools → Application → Session Storage
   - Should see: `kycEmail` and `kycData`

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  1. User fills KYC form                                      │
│     Location: /kyc                                           │
│     File: app/kyc/page.tsx                                   │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Frontend calls API route                                 │
│     POST /api/kyc                                            │
│     File: app/api/kyc/route.ts                               │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  3. API route calls backend                                  │
│     POST /partner/api/kyc/create-session                     │
│     Backend creates Veriff session                           │
│     Returns: { verificationUrl, sessionId }                  │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Frontend redirects to Veriff                             │
│     window.location.href = verificationUrl                   │
│     User leaves onboarding app                               │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  5. User completes Veriff verification                       │
│     - Takes selfie                                           │
│     - Uploads ID photo                                       │
│     - Veriff processes (2-5 minutes)                         │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Veriff redirects back                                    │
│     Location: /kyc/pending                                   │
│     File: app/kyc/pending/page.tsx                           │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Pending page polls status                                │
│     GET /partner/api/kyc/status?email=xxx                    │
│     Every 3 seconds until approved/declined                  │
└────────────────────────────┬────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│  8. Redirect to next step                                    │
│     If approved → router.push('/billing')                    │
│     If declined → show error, allow retry                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

**Issue: "Failed to create KYC session"**
- Check: Is backend running? (`portal-backend-dev`)
- Check: Is `PORTAL_BACKEND_URL` correct in `.env.local`?
- Check: Are backend endpoints implemented? (CWI-159)

**Issue: Stuck on "Verifying..." forever**
- Check: Did Veriff webhook fire? (Check backend logs)
- Check: Is status endpoint returning data? (Check network tab)
- Check: Is email in sessionStorage correct?

**Issue: Veriff URL is undefined**
- Check: Backend response includes `verificationUrl` field
- Check: Backend called Veriff API successfully
- Check: Veriff credentials are correct in backend `.env`

---

## Next Steps

After making these 3 changes:
1. ✅ Backend must implement CWI-159 (Veriff endpoints)
2. ✅ Configure Veriff webhook in dashboard
3. ✅ Test end-to-end flow
4. ✅ Deploy both frontend and backend

---

**Estimated Time:** 30-45 minutes to make all onboarding-app changes
