# DocuSign Partner Onboarding - Complete Setup Guide

This guide covers the complete setup and testing of the DocuSign integration for the WanAware partner onboarding application.

## Overview

The partner onboarding flow consists of 3 main steps:
1. **KYC Verification** (SumSub) - Identity verification
2. **Document Signing** (DocuSign) - Sign partner agreements
3. **Account Provisioning** - Create partner organization and admin user

## Architecture

**Frontend (Onboarding App):**
- React app on port 3001
- Located: `/onboarding-app/onboarding-app/`
- Branch: `Pratiksha-Api-integration`

**Backend (Portal Backend):**
- Node.js/Express API on port 4000
- Located: `/portal-backend-dev-clone/`
- Branch: `feature/sumsub-kyc-integration` (also on `dev`)

## Prerequisites

### 1. DocuSign Setup

You need the following from DocuSign:

- **Account ID** - From DocuSign Settings → API and Keys
- **Integration Key** - Create app in Settings → Apps and Keys
- **RSA Private Key** - Generated when creating Integration Key
- **User ID** - Your API Username (GUID) from Settings → Profile
- **8 Template IDs** - One for each agreement document

#### Templates Required:

**Base Documents (All Partners):**
1. NDA - Non-Disclosure Agreement
2. MSA - Master Subscription Agreement
3. AUP - Acceptable Use Policy
4. DPA - Data Processing Agreement

**Partner-Specific Addendums:**
5. Reseller Addendum (for MSP partners)
6. Distributor Addendum
7. SI Addendum (Systems Integrator)
8. Referral Addendum (for Advisor partners)

**Important:** Each template must have a recipient role named exactly `Partner Signer`

### 2. Template Field Requirements

Each template should include these fields (assigned to "Partner Signer"):
- **Signature** field (required)
- **Date Signed** field (auto-fills)
- **Text field** labeled "Company Name"
- **Text field** labeled "Signer Name"
- **Text field** labeled "Signer Email"

The backend will automatically pre-fill these text fields.

## Configuration

### Backend Configuration

Update `/portal-backend-dev-clone/.env`:

```env
# DocuSign Credentials (JWT Authentication)
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
DOCUSIGN_INTEGRATION_KEY=your-integration-key
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_REDIRECT_URI=http://localhost:3001

# Template IDs (Get these from DocuSign)
DOCUSIGN_TEMPLATE_NDA=your-nda-template-id
DOCUSIGN_TEMPLATE_MSA=your-msa-template-id
DOCUSIGN_TEMPLATE_AUP=your-aup-template-id
DOCUSIGN_TEMPLATE_DPA=your-dpa-template-id
DOCUSIGN_TEMPLATE_RESELLER=your-reseller-template-id
DOCUSIGN_TEMPLATE_DISTRIBUTOR=your-distributor-template-id
DOCUSIGN_TEMPLATE_SI=your-si-template-id
DOCUSIGN_TEMPLATE_REFERRAL=your-referral-template-id
```

### Frontend Configuration

Update `/onboarding-app/onboarding-app/.env`:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:4000

# SumSub KYC Configuration
SUMSUB_APP_TOKEN=your-sumsub-token
SUMSUB_SECRET_KEY=your-sumsub-secret
SUMSUB_LEVEL_NAME=basic-kyc-level
```

## Installation & Running

### Backend

```bash
cd portal-backend-dev-clone
npm install
npm run dev
```

Backend should be running on **http://localhost:4000**

### Frontend

```bash
cd onboarding-app/onboarding-app
npm install
npm run dev
```

Frontend should be running on **http://localhost:3001**

## Testing the Complete Flow

### 1. Start Both Servers

Make sure both backend (port 4000) and frontend (port 3001) are running.

### 2. Access the Onboarding App

Open your browser to:
```
http://localhost:3001/kyc?email=test@company.com&partnerType=msp
```

**URL Parameters:**
- `email` - Partner's email address
- `partnerType` - One of: `msp`, `distributor`, `si`, `advisor`

### 3. Complete KYC Verification

Follow the SumSub KYC flow to verify identity. This must be completed before document signing.

### 4. Document Signing

Once KYC is approved, the app will navigate to the signing page where:
- Partner reviews all required documents
- Clicks "Sign Documents with DocuSign"
- Gets redirected to DocuSign's embedded signing interface
- Signs all documents in one session
- Returns to the app

### 5. Account Provisioning

After signing is complete:
- App calls the provision API
- Creates organization in user-authentication-service
- Creates admin user with Auth0
- Sets up Permit.io tenant and permissions
- Displays success page

## API Endpoints

### DocuSign Endpoints

**Create Envelope:**
```
POST http://localhost:4000/api/partner/sign/create-envelope

Body:
{
  "email": "partner@company.com",
  "signerName": "John Doe",
  "partnerType": "msp",
  "companyName": "Acme Corp",
  "returnUrl": "http://localhost:3001/signing?event=signing_complete"
}

Response:
{
  "success": true,
  "envelopeId": "abc-123-xyz",
  "signingUrl": "https://demo.docusign.net/signing/..."
}
```

**Check Status:**
```
GET http://localhost:4000/api/partner/sign/status?envelopeId=abc-123-xyz

Response:
{
  "status": "completed",
  "signedAt": "2024-03-10T12:00:00Z"
}
```

### Provision Endpoint

```
POST http://localhost:4000/api/partner/provision

Body:
{
  "email": "partner@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp",
  "website": "https://acme.com",
  "partnerType": "msp",
  "kycSessionId": "kyc-session-id",
  "docusignEnvelopeId": "envelope-id",
  "journeyData": { ... }
}
```

## Document Package by Partner Type

**MSP Partners receive:**
- NDA
- MSA
- AUP
- DPA
- Reseller Addendum
**Total: 5 documents**

**Distributor Partners receive:**
- NDA
- MSA
- AUP
- DPA
- Distributor Addendum
**Total: 5 documents**

**SI Partners receive:**
- NDA
- MSA
- AUP
- DPA
- SI Addendum
**Total: 5 documents**

**Advisor Partners receive:**
- NDA
- MSA
- AUP
- DPA
- Referral Addendum
**Total: 5 documents**

## Troubleshooting

### "Invalid template ID" Error

**Cause:** Template IDs don't match your DocuSign account or templates don't exist.

**Fix:**
1. Verify template IDs in DocuSign match your `.env` file
2. Check `DOCUSIGN_ACCOUNT_ID` is correct
3. Ensure templates are activated (not in draft mode)

### "Consent required" Error

**Cause:** JWT application hasn't been granted consent.

**Fix:**
Visit the consent URL (provided in error message) and approve the application.

### "Role name not found" Error

**Cause:** Template recipient role is not named "Partner Signer"

**Fix:**
Edit each template in DocuSign and ensure the recipient role is named exactly `Partner Signer`

### Documents not pre-filling

**Cause:** Field labels in templates don't match expected names.

**Fix:**
Ensure your templates have text fields with these EXACT labels:
- `Company Name`
- `Signer Name`
- `Signer Email`

### Envelope creates but only shows 1 document

**Cause:** Composite template configuration issue.

**Fix:**
- Verify all template IDs are valid
- Check backend logs for specific errors
- Ensure templates are in the same DocuSign account

## Production Deployment

When moving to production:

1. **Create production DocuSign account**
2. **Re-create all 8 templates** in production
3. **Update environment variables:**
   ```env
   DOCUSIGN_BASE_URL=https://na3.docusign.net/restapi
   DOCUSIGN_ACCOUNT_ID=production-account-id
   DOCUSIGN_INTEGRATION_KEY=production-key
   # ... other production credentials
   ```
4. **Re-grant consent** using production URL
5. **Update frontend** `VITE_API_BASE_URL` to production backend URL

## Security Notes

- Never commit `.env` files to git
- Store private keys securely
- Use different accounts for dev/stage/production
- Implement rate limiting on API endpoints
- Enable webhook handlers for envelope status updates
- Log all DocuSign API calls for audit purposes

## Support

For issues with:
- **DocuSign API:** https://developers.docusign.com/docs
- **SumSub KYC:** https://docs.sumsub.com
- **Backend code:** Check `/portal-backend-dev-clone/src/controllers/partner-onboarding/`
- **Frontend code:** Check `/onboarding-app/onboarding-app/src/pages/`

## File Locations

**Backend:**
- Controller: `src/controllers/partner-onboarding/sign.controller.js`
- Routes: `src/routes/partner-onboarding/sign.routes.js`
- Service: `src/services/docusign-auth.service.js`

**Frontend:**
- Signing Page: `src/pages/SigningPage.tsx`
- API Config: `src/config/api.ts`

---

**Last Updated:** March 10, 2026
**Version:** 1.0
