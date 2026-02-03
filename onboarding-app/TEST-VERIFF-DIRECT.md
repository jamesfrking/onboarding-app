# Testing Veriff Without Backend

## Option 1: Direct Frontend → Veriff API (Quick Test)

You can test Veriff **without implementing the backend** by calling Veriff API directly from your frontend.

⚠️ **WARNING:** This is for TESTING ONLY. Never put API secrets in frontend code in production!

---

### Step 1: Create Test API Route

**File:** `app/api/kyc-test/route.ts` (create new file)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ⚠️ TESTING ONLY - Never put secrets in frontend code in production!
const VERIFF_API_KEY = '31b42483-5a70-4d28-b80c-e7116fd7a7b4';
const VERIFF_API_SECRET = 'ce5f9e77-a8a9-4ffc-a4c5-49a600837c99';

function generateSignature(payload: any): string {
    const message = JSON.stringify(payload);
    return crypto
        .createHmac('sha256', VERIFF_API_SECRET)
        .update(message)
        .digest('hex')
        .toLowerCase();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, executiveName, businessAddress, city, state, zipCode, country } = body;

        // Split executive name
        const [firstName, ...lastNameParts] = executiveName.trim().split(' ');
        const lastName = lastNameParts.join(' ');

        // Create Veriff session payload
        const payload = {
            verification: {
                callback: 'https://your-temp-webhook-url.com/webhook', // Use webhook.site for testing
                person: {
                    firstName,
                    lastName
                },
                document: {
                    country: country, // USA, CAN, GBR, AUS
                    type: 'DRIVERS_LICENSE'
                },
                address: {
                    fullAddress: `${businessAddress}, ${city}, ${state} ${zipCode}`,
                    supportedCountries: [country]
                },
                vendorData: email,
                timestamp: new Date().toISOString()
            }
        };

        const signature = generateSignature(payload);

        // Call Veriff API
        const response = await fetch('https://stationapi.veriff.com/v1/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-CLIENT': VERIFF_API_KEY,
                'X-HMAC-SIGNATURE': signature
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Veriff API error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create Veriff session' },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            verificationUrl: data.verification.url,
            sessionId: data.verification.id
        });
    } catch (error) {
        console.error('Error creating Veriff session:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

---

### Step 2: Update KYC Page to Use Test Route

**File:** `app/kyc/page.tsx`

**Change line 84 from:**
```typescript
const response = await fetch('/api/kyc', {
```

**To:**
```typescript
const response = await fetch('/api/kyc-test', {
```

---

### Step 3: Set Up Webhook Testing

Since you don't have a backend to receive webhooks yet, use a webhook testing service:

**Option A: webhook.site**
1. Go to https://webhook.site/
2. Copy your unique URL (e.g., `https://webhook.site/abc123`)
3. Update line 107 in the test route:
   ```typescript
   callback: 'https://webhook.site/abc123', // Your webhook.site URL
   ```

**Option B: ngrok (if testing locally)**
```bash
# Terminal 1: Start your app
cd "one pager/onboarding-app"
npm run dev

# Terminal 2: Expose to internet
ngrok http 3000

# Use ngrok URL in callback
callback: 'https://abc123.ngrok.io/api/kyc/webhook'
```

---

### Step 4: Test the Flow

1. **Start the app:**
   ```bash
   cd "one pager/onboarding-app"
   npm run dev
   ```

2. **Go to KYC page:**
   - http://localhost:3000/kyc

3. **Fill out the form:**
   - Company name, tax ID, executive name, address

4. **Submit:**
   - You'll be redirected to Veriff's verification page
   - **Real URL format:** `https://magic.veriff.me/v/xxxxx`

5. **Complete verification:**
   - Take selfie with your phone/webcam
   - Upload front/back of your ID (driver's license, passport, etc.)

6. **Check webhook:**
   - Go to your webhook.site URL
   - You should see Veriff's webhook POST within 2-5 minutes
   - Look for `"status": "approved"` or `"status": "declined"`

---

### Step 5: Manual Status Check

Since you don't have the status endpoint yet, check Veriff dashboard:

1. Log in to https://station.veriff.com/
2. Go to **Sessions** tab
3. Find your session by email/timestamp
4. See verification decision: Approved, Declined, or Resubmission Requested

---

## Option 2: Mock Backend Response (Even Simpler)

If you just want to test the frontend flow without calling Veriff at all:

**File:** `app/api/kyc-mock/route.ts` (create new file)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    // Simulate delay (like real API)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock Veriff URL
    return NextResponse.json({
        success: true,
        verificationUrl: 'https://magic.veriff.me/v/MOCK-SESSION-123',
        sessionId: 'mock-session-123'
    });
}
```

**Usage:** Change line 84 in `app/kyc/page.tsx` to:
```typescript
const response = await fetch('/api/kyc-mock', {
```

This lets you test the redirect logic without actually going to Veriff.

---

## Option 3: Use Veriff's Demo Environment

Veriff provides a demo environment where you can test without your backend:

**Test Credentials:**
- API Key: Use your real key (`31b42483-5a70-4d28-b80c-e7116fd7a7b4`)
- API Secret: Use your real secret (`ce5f9e77-a8a9-4ffc-a4c5-49a600837c99`)
- Base URL: `https://stationapi.veriff.com/v1` (same as production)

**Test Mode Features:**
- Auto-approves most verifications
- Accepts any clear ID photo
- Fast processing (30 seconds instead of 2-5 minutes)
- Free (no charges)

**To trigger specific results in test mode:**
- **Auto-approve:** Use any normal ID photo
- **Decline:** Name the file `decline.jpg`
- **Resubmit:** Use a blurry/dark photo

---

## Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Direct API** | Tests real Veriff flow | Requires creating test route, exposes secrets | Quick integration test |
| **Mock Response** | Super fast, no external dependencies | Doesn't test actual Veriff | Frontend UI testing |
| **Veriff Demo** | Real Veriff experience, safe for testing | Still need to create test route | Full end-to-end testing |

---

## My Recommendation

**For right now:**
1. Use **Option 1: Direct API** with webhook.site
2. This lets you test the actual Veriff experience
3. Takes 10 minutes to set up
4. You'll see exactly how it works

**Steps:**
```bash
# 1. Create test route
# Copy code from above into app/api/kyc-test/route.ts

# 2. Update KYC page
# Change /api/kyc to /api/kyc-test

# 3. Get webhook URL
# Visit webhook.site, copy URL, paste in test route

# 4. Test
npm run dev
# Go to /kyc, fill form, submit
# You'll be redirected to real Veriff!

# 5. Complete verification
# Take selfie, upload ID

# 6. Check webhook.site
# See Veriff's response
```

---

## Security Note

⚠️ **IMPORTANT:** The test route above includes your API secret in the code. This is OK for local testing, but:
- ✅ Never commit this file to Git
- ✅ Never deploy this to production
- ✅ Delete `app/api/kyc-test/route.ts` after testing
- ✅ Use proper backend (CWI-159) for production

Add to `.gitignore`:
```
app/api/kyc-test/
```

---

## Next Steps

After testing Veriff directly:
1. ✅ You've confirmed Veriff works
2. ✅ You've seen the user experience
3. ✅ You know what to expect from webhooks
4. ➡️ Now implement proper backend (CWI-159)
5. ➡️ Remove test route, use real backend endpoints

---

**Want me to create the test route file for you?** I can implement Option 1 (Direct API) so you can test Veriff right now!
