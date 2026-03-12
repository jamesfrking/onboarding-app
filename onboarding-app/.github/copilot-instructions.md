# Partner Onboarding App - AI Agent Guide

## Architecture Overview

This is a **React + Vite + TypeScript** partner onboarding app, NOT Next.js despite the outdated README. The app uses Vercel serverless functions (`/api`) for KYC integration with both Sumsub and Veriff providers.

**Key architectural decisions:**
- **Vite-based SPA** with React Router (client-side routing)
- **Vercel Edge Functions** in `/api` directory (NOT Next.js API routes)
- **sessionStorage state management** for multi-step onboarding flow (no Redux/Zustand)
- **Dual KYC provider support**: Sumsub (current) and Veriff (migration in progress via `VERIFF-CHANGES-GUIDE.md`)

## Critical Workflows

### Development
```bash
npm run dev  # Starts Vite dev server on port 5173 (NOT 3000)
npm run build
npm run preview
```

**Important**: Vite dev server (`vite.config.ts`) includes inline middleware for `/api/kyc-sumsub` route that uses Node.js `crypto` module. In production, Vercel uses Edge Functions in `/api/*.js` files which must use Web Crypto API.

### API Routes (Vercel Serverless)
Files in `/api` directory are Vercel Edge Functions with `export const config = { runtime: 'edge' }`:
- `kyc-sumsub.js` - Production Sumsub KYC integration (Web Crypto API)
- `kyc-test.js` - Testing endpoint with hardcoded Veriff credentials (DO NOT USE IN PRODUCTION)
- `kyc-aml.js` - Alternative KYC provider endpoint

**Critical crypto difference**:
- **Dev server** (vite.config.ts): Uses Node.js `crypto.createHmac()`
- **Edge Functions** (api/*.js): Uses Web Crypto `crypto.subtle.importKey()` + `.sign()`

## Multi-Step Onboarding Flow

The app uses **sessionStorage** to pass data between pages. Never use Redux or context for state in this codebase.

**Flow**: `/ → /kyc → /signing → /success`

### Data flow pattern:
1. **KycPage**: Receives URL params (`?email=...&firstName=...`), stores in sessionStorage as `partnerData` and `kycData`
2. **SigningPage**: Reads `kycData` from sessionStorage, stores `documentsSigned` flag
3. **SuccessPage**: Reads completion flags, calls `sessionStorage.clear()` on final redirect

**Example from KycPage.tsx**:
```typescript
sessionStorage.setItem('partnerData', JSON.stringify(partner));
sessionStorage.setItem('kycData', JSON.stringify(formData));
```

## KYC Integration Patterns

### Current: Sumsub
- Uses `@sumsub/websdk-react` component
- Token generation in `/api/kyc-sumsub` with HMAC-SHA256 signature
- Environment variables: `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`, `SUMSUB_LEVEL_NAME`

**Critical implementation details**:
- Each session creates unique `userId: ${email}-${Date.now()}` for fresh applicant
- Signature format: `timestamp + httpMethod + urlPath + requestBody`
- Token TTL: 600 seconds, refresh via `accessTokenExpirationHandler` callback

### Migration: Veriff
See `VERIFF-CHANGES-GUIDE.md` for migration instructions. Key differences:
- Country code mapping required (US/USA → US, UK/GBR → GB)
- Name splitting logic: `executiveName.split(' ')` into firstName/lastName
- Different signature algorithm and payload structure

## Styling Conventions

**Tailwind CSS** with inline utility classes. No component libraries. Common patterns:
- Background gradients: `style={{ background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)' }}`
- Progress indicators: Colored circles with checkmarks, connected by horizontal lines
- Card styling: `bg-white border border-slate-200 rounded-xl p-6`

## Environment Setup

Required environment variables (not in repo):
```
SUMSUB_APP_TOKEN=...
SUMSUB_SECRET_KEY=...
SUMSUB_LEVEL_NAME=basic-kyc-level
```

For production deployment, see `PRODUCTION_CHECKLIST.md` which documents the full architecture including HubSpot integration, backend API contracts, and dual-write pattern.

## Testing

**Never commit API credentials**. The `kyc-test.js` file contains hardcoded test credentials marked with `⚠️ TESTING ONLY` - these should be removed before production.

Use `TEST-VERIFF-DIRECT.md` for testing Veriff without backend integration.

## Common Pitfalls

1. **Crypto API mismatch**: Don't mix Node.js crypto in Edge Functions (causes runtime errors)
2. **sessionStorage assumptions**: Data is cleared on `/success` page - don't expect persistence
3. **README is outdated**: Project is Vite, not Next.js (ignore README.md instructions)
4. **Port confusion**: Dev server runs on 5173, not 3000
5. **URL parameters**: KycPage expects `?email=...&firstName=...` format from landing page
