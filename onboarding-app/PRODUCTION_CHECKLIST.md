# Partner Onboarding App - Production Readiness Checklist

This document outlines everything needed to make the Partner Onboarding App production-ready.

---

## Architecture Overview

The partner onboarding flow uses a **dual-write pattern**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LANDING PAGE (Step 1)                               │
│                    msp-scrollable-hardcoded.html                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User clicks "Activate"
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   HubSpot Forms   │           │   Your Backend    │
        │   API (marketing) │           │   (primary data)  │
        │                   │           │                   │
        │ api.hsforms.com   │           │ partners.wanaware │
        │                   │           │ .com/hubspot-     │
        │                   │           │ onboarding-hook   │
        └───────────────────┘           └───────────────────┘
                                                │
                                                │ Stores partner data
                                                │
                                                ▼
                                    ┌───────────────────┐
                                    │   Your Database   │
                                    │   (PostgreSQL)    │
                                    └───────────────────┘
                                                │
                                                │ Redirect to onboarding app
                                                ▼
        ┌─────────────────────────────────────────────────────────────────────┐
        │                      ONBOARDING APP (Steps 2-5)                     │
        │                      onboarding.wanaware.com                        │
        │                                                                     │
        │   /start → /kyc → /billing → /sign → /success                       │
        └─────────────────────────────────────────────────────────────────────┘
```

**Key insight:** The landing page JavaScript sends data **directly** to your backend at `https://partners.wanaware.com/hubspot-onboarding-hook`. No HubSpot webhooks needed. HubSpot gets a copy for marketing/CRM purposes only.

---

## 1. Backend Endpoint Required (Already Receiving Data)

### `POST https://partners.wanaware.com/hubspot-onboarding-hook`

**Purpose:** Receives partner journey data directly from the landing page

**This endpoint is already being called** by the landing page JavaScript (see `js/msp-scrollable.js` line ~2270).

**Request payload:**
```json
{
  "email": "partner@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "company": "Acme MSP",
  "partnerType": "msp",
  "goal": "expand_offerings",
  "targetSize": "SMB",
  "regions": "US; Canada",
  "mspOffers": "NOC; SD-WAN; SASE/SSE",
  "whiteLabelRequired": "Yes"
}
```

**What this endpoint should do:**
1. Validate the incoming data
2. Store in your database (PostgreSQL)
3. Return success (200 OK)

**Example implementation (Java/Spring):**
```java
@PostMapping("/hubspot-onboarding-hook")
public ResponseEntity<?> receivePartnerData(@RequestBody PartnerJourneyDTO data) {
    // Validate required fields
    if (data.getEmail() == null || data.getEmail().isBlank()) {
        return ResponseEntity.badRequest().body("Email is required");
    }

    // Store in database
    partnerRepository.upsertByEmail(data);

    return ResponseEntity.ok().build();
}
```

---

## 2. Onboarding App API Endpoints

These endpoints serve the onboarding app after the user is redirected:

### `GET /api/partner?email={email}`

**Purpose:** Fetch partner data that was stored from the landing page

**Request:**
```
GET https://partners.wanaware.com/api/partner?email=partner@example.com
```

**Response:**
```json
{
  "email": "partner@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme MSP",
  "partnerType": "msp",
  "goal": "Expand service offerings",
  "targetSize": "SMB",
  "regions": "US, Canada",
  "mspOffers": "NOC, SD-WAN, SASE/SSE",
  "whiteLabelRequired": "Yes"
}
```

**Implementation:** Query the same database where `hubspot-onboarding-hook` stored the data.

---

### `POST /api/kyc`

**Purpose:** Submit KYC verification data

**Request:**
```json
{
  "email": "partner@example.com",
  "companyLegalName": "Acme Corp LLC",
  "companyWebsite": "https://acme.com",
  "taxId": "12-3456789",
  "executiveName": "John Doe",
  "executiveTitle": "CEO",
  "businessAddress": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "US"
}
```

**Response:**
```json
{
  "success": true,
  "verificationId": "kyc_abc123",
  "status": "passed"
}
```

**Implementation options:**
- Integrate with KYC provider (Middesk, Persona)
- Manual review workflow
- Auto-approve for demo/MVP

---

### `POST /api/billing`

**Purpose:** Set up Stripe customer and payment method

**⚠️ IMPORTANT:** The current mock form sends raw card data. For production, use Stripe Elements to tokenize client-side.

**Production request (with Stripe token):**
```json
{
  "email": "partner@example.com",
  "paymentMethodId": "pm_xxx",
  "billingName": "John Doe",
  "billingEmail": "billing@acme.com"
}
```

**Response:**
```json
{
  "success": true,
  "customerId": "cus_abc123",
  "subscriptionId": "sub_abc123"
}
```

---

### `POST /api/provision`

**Purpose:** Provision partner account after document signing

**Request:**
```json
{
  "email": "partner@example.com",
  "partner": {
    "firstName": "John",
    "lastName": "Doe",
    "company": "Acme MSP",
    "partnerType": "msp"
  },
  "kyc": {
    "companyLegalName": "Acme Corp LLC",
    "taxId": "12-3456789"
  },
  "signedDocuments": ["nda", "msa", "reseller-addendum", "aup", "dpa"],
  "signedAt": "2025-01-31T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "auth0|abc123",
  "organizationId": "org_abc123",
  "portalUrl": "https://app.wanaware.com"
}
```

**Implementation tasks:**
1. Create organization in UAS (see Section 3 below)
2. Create admin user in UAS
3. Activate Stripe subscription
4. Send welcome email
5. Update HubSpot contact status (optional)

---

## 3. UAS Account Provisioning (Critical)

The User Authentication Service (UAS) is the central authority for organizations and users. Partner provisioning requires calling UAS GraphQL mutations.

### Partner Type to UAS Organization Mapping

| Landing Page `partnerType` | UAS `OrganizationSubtype` | UAS Mutation |
|---------------------------|---------------------------|--------------|
| `msp` | `MSP` | `createReseller` |
| `distributor` | `Distributor` | `createReseller` |
| `advisor` | `Advisor` | `createReseller` |
| `si` | `Reseller` | `createReseller` |
| `var` | `Reseller` | `createReseller` |

### Step 1: Create Organization via `createReseller`

**GraphQL Mutation:**
```graphql
mutation CreatePartnerOrganization($input: ResellerInput!) {
  createReseller(input: $input) {
    id
    organizationName
    domain
    organizationType
    organizationSubtype
    createdAt
  }
}
```

**Variables (ResellerInput):**
```json
{
  "input": {
    "organizationName": "Acme MSP",
    "domain": "acme-msp",
    "organizationSubtype": "MSP",
    "organizationEmail": "partner@acme.com",
    "organizationPhone": "+1234567890",
    "organizationTaxid": "12-3456789",
    "organizationSiteid": "SITE001",
    "companyLogo": [],
    "map": {
      "partnerType": "msp",
      "regions": "US, Canada",
      "mspOffers": "NOC, SD-WAN",
      "signedAt": "2025-01-31T12:00:00Z"
    }
  }
}
```

**Required fields:**
- `organizationName` - Company legal name from KYC
- `domain` - URL-safe slug (e.g., "acme-msp")
- `organizationSubtype` - One of: `MSP`, `Distributor`, `Advisor`, `Reseller`
- `companyLogo` - Empty array `[]` initially

**Optional fields:**
- `organizationEmail` - Partner contact email
- `organizationPhone` - Partner phone
- `organizationTaxid` - Tax ID from KYC
- `organizationSiteid` - Site identifier
- `map` - JSON for custom metadata (store partner journey data here)

### Step 2: Create Admin User via `createUser`

**GraphQL Mutation:**
```graphql
mutation CreatePartnerAdmin($input: UserInput!) {
  createUser(input: $input) {
    uid
    email
    displayName
    status
    roles
    createdAt
  }
}
```

**Variables (UserInput):**
```json
{
  "input": {
    "email": "partner@acme.com",
    "password": "TemporaryP@ss123!",
    "displayName": "John Doe",
    "roles": ["Partner_Admin"],
    "map": {
      "title": "CEO",
      "onboardedAt": "2025-01-31T12:00:00Z"
    }
  }
}
```

**Required fields:**
- `email` - Partner email
- `password` - Temporary password (or use Auth0 passwordless)
- `displayName` - Executive name from KYC
- `roles` - Array of roles, typically `["Partner_Admin"]`

### Step 3: M2M Authentication

Your backend needs an M2M token to call UAS. Use the `integratorAuth` mutation:

```graphql
mutation {
  integratorAuth(input: { key: "YOUR_M2M_CLIENT_ID" }) {
    accessToken
    expiresIn
  }
}
```

### Complete Provisioning Flow (Java/Spring Example)

```java
@Service
public class PartnerProvisioningService {

    private final UASGraphQLClient uasClient;
    private final StripeService stripeService;
    private final EmailService emailService;

    public ProvisionResult provisionPartner(ProvisionRequest request) {
        // 1. Map partner type to UAS subtype
        String orgSubtype = mapPartnerType(request.getPartner().getPartnerType());

        // 2. Create organization in UAS
        ResellerInput orgInput = ResellerInput.builder()
            .organizationName(request.getKyc().getCompanyLegalName())
            .domain(slugify(request.getKyc().getCompanyLegalName()))
            .organizationSubtype(orgSubtype)
            .organizationEmail(request.getEmail())
            .organizationTaxid(request.getKyc().getTaxId())
            .companyLogo(List.of())
            .map(Map.of(
                "partnerType", request.getPartner().getPartnerType(),
                "signedDocuments", request.getSignedDocuments(),
                "signedAt", request.getSignedAt()
            ))
            .build();

        ResellerResponse org = uasClient.createReseller(orgInput);

        // 3. Create admin user in UAS
        String tempPassword = generateSecurePassword();
        UserInput userInput = UserInput.builder()
            .email(request.getEmail())
            .password(tempPassword)
            .displayName(request.getPartner().getFirstName() + " " + request.getPartner().getLastName())
            .roles(List.of("Partner_Admin"))
            .build();

        UserResponse user = uasClient.createUser(userInput);

        // 4. Activate Stripe subscription
        stripeService.activateSubscription(request.getEmail(), org.getId());

        // 5. Send welcome email with password reset link
        emailService.sendPartnerWelcome(request.getEmail(), tempPassword);

        return ProvisionResult.builder()
            .success(true)
            .userId(user.getUid())
            .organizationId(org.getId())
            .portalUrl("https://app.wanaware.com")
            .build();
    }

    private String mapPartnerType(String partnerType) {
        return switch (partnerType.toLowerCase()) {
            case "msp" -> "MSP";
            case "distributor" -> "Distributor";
            case "advisor" -> "Advisor";
            default -> "Reseller";
        };
    }
}
```

### UAS GraphQL Endpoint

```
Production: https://api.wanaware.com/uas/graphql
Staging: https://api-staging.wanaware.com/uas/graphql
```

### Error Handling

| UAS Error | Meaning | Action |
|-----------|---------|--------|
| `DOMAIN_ALREADY_EXISTS` | Organization domain taken | Append random suffix to domain |
| `EMAIL_ALREADY_EXISTS` | User already exists | Link to existing user or return error |
| `INVALID_SUBTYPE` | Unknown organization subtype | Map to `Reseller` as fallback |

---

## 4. Demo Mode (Currently Enabled)

For testing without backend APIs, demo mode is enabled:

| File | Line | Current | Production |
|------|------|---------|------------|
| `src/pages/StartPage.tsx` | ~26 | `demoMode = true` | Set to `false` or use env var |
| `src/pages/KycPage.tsx` | ~95 | `demoMode = true` | Set to `false` or use env var |

**Recommendation:** Use environment variable instead:
```tsx
const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
```

---

## 5. DocuSign Integration (Document Signing)

### Backend Endpoints for DocuSign

#### `POST /api/sign/create-envelope`

**Purpose:** Creates a DocuSign envelope with all required documents for the partner to sign

**Request:**
```json
{
  "email": "partner@example.com",
  "signerName": "John Doe",
  "partnerType": "msp",
  "companyName": "Acme MSP LLC"
}
```

**Response:**
```json
{
  "success": true,
  "envelopeId": "abc123-def456",
  "signingUrl": "https://demo.docusign.net/Signing/..."
}
```

**Implementation:**
1. Use DocuSign eSignature API to create envelope
2. Include all documents based on partner type
3. Return embedded signing URL for iframe/redirect

#### `POST /api/sign/webhook` (DocuSign Connect)

**Purpose:** DocuSign calls this when envelope status changes (completed, declined, etc.)

**Payload from DocuSign:**
```json
{
  "event": "envelope-completed",
  "envelopeId": "abc123-def456",
  "status": "completed",
  "completedDateTime": "2025-01-31T12:00:00Z"
}
```

**Implementation:**
1. Verify webhook signature
2. Update partner record with `signedAt`, `envelopeId`
3. Mark partner as ready for provisioning

### Document Templates Required

Create these templates in DocuSign:

| Document | Template ID | Partner Types | Notes |
|----------|-------------|---------------|-------|
| **NDA** | `nda_template_xxx` | All | Non-Disclosure Agreement |
| **MSA** | `msa_template_xxx` | All | Master Service Agreement |
| **Reseller Addendum** | `reseller_template_xxx` | MSP | MSP-specific terms |
| **Distributor Addendum** | `distributor_template_xxx` | Distributor | Distribution terms |
| **SI Addendum** | `si_template_xxx` | SI | System Integrator terms |
| **Referral Agreement** | `referral_template_xxx` | Advisor | Referral commission terms |
| **AUP** | `aup_template_xxx` | All | Acceptable Use Policy |
| **DPA** | `dpa_template_xxx` | All | Data Processing Addendum |

### Partner Type to Addendum Mapping

```java
private String getAddendumTemplateId(String partnerType) {
    return switch (partnerType.toLowerCase()) {
        case "msp" -> "reseller_template_xxx";
        case "distributor" -> "distributor_template_xxx";
        case "si" -> "si_template_xxx";
        case "advisor" -> "referral_template_xxx";
        default -> "reseller_template_xxx";
    };
}
```

### DocuSign Configuration

**Required credentials (store in backend env):**
```env
DOCUSIGN_INTEGRATION_KEY=xxx
DOCUSIGN_SECRET_KEY=xxx
DOCUSIGN_ACCOUNT_ID=xxx
DOCUSIGN_USER_ID=xxx
DOCUSIGN_BASE_URL=https://demo.docusign.net  # or https://na4.docusign.net for prod
```

**Webhook (DocuSign Connect) setup:**
1. Go to DocuSign Admin → Connect
2. Add configuration pointing to `https://partners.wanaware.com/api/sign/webhook`
3. Select events: `envelope-completed`, `envelope-declined`, `envelope-voided`

### Frontend Changes for DocuSign

Update `SignPage.tsx` to:
1. Call `POST /api/sign/create-envelope` to get signing URL
2. Either redirect to DocuSign or embed in iframe
3. Poll for completion or wait for redirect callback

---

## 6. Third-Party Integrations Summary

### Stripe (Billing) - Required
- [ ] Replace mock billing form with Stripe Elements
- [ ] Set up Stripe webhook for payment events
- [ ] Configure subscription plans/products

**Files to modify:** `src/pages/BillingPage.tsx`

### DocuSign (Document Signing) - Required for real contracts
- [ ] Create DocuSign developer account
- [ ] Set up 8 document templates (see Section 5)
- [ ] Implement `POST /api/sign/create-envelope`
- [ ] Implement `POST /api/sign/webhook`
- [ ] Configure DocuSign Connect webhook

**Files to modify:** `src/pages/SignPage.tsx`

### Auth0 (via UAS) - Required for provisioning
- [ ] UAS already handles Auth0 integration
- [ ] Ensure `Partner_Admin` role exists
- [ ] Set up welcome email with password reset link

### Email Service - Required
- [ ] SendGrid or similar for welcome emails
- [ ] Template for partner welcome email with:
  - Login URL
  - Temporary password or magic link
  - Getting started guide link

---

## 7. Environment Variables

Create `.env` file:

```env
# API
VITE_API_BASE_URL=https://partners.wanaware.com

# Feature Flags
VITE_DEMO_MODE=false

# Stripe (client-side)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# DocuSign (if using embedded signing)
VITE_DOCUSIGN_INTEGRATION_KEY=xxx
```

---

## 8. Deployment

### Onboarding App

**Option A: Vercel (Recommended)**
```bash
cd "one pager/onboarding-app"
npm run build
vercel --prod
```

Configure custom domain: `onboarding.wanaware.com`

### Landing Page

The landing page (`msp-scrollable-hardcoded.html`) is designed for HubSpot CMS. Upload to HubSpot:
1. Go to Marketing → Files and Templates → Design Tools
2. Upload HTML, CSS, and JS files
3. Configure the page in HubSpot

**Production URLs:**
- Landing page: `https://engage.wanaware.com/partner-program`
- Onboarding app: `https://onboarding.wanaware.com`

---

## 9. Security Checklist

- [ ] HTTPS only (both landing page and onboarding app)
- [ ] Rate limit `/hubspot-onboarding-hook` endpoint
- [ ] Validate email format and sanitize inputs
- [ ] Add CORS headers (allow only known origins)
- [ ] Use Stripe Elements for PCI compliance
- [ ] Set up error monitoring (Sentry)

---

## 10. Testing Checklist

- [ ] Test landing page → backend hook → onboarding app flow
- [ ] Test with different partner types (MSP, Distributor, SI, Advisor)
- [ ] Test KYC form validation
- [ ] Test error states (network failures, API errors)
- [ ] Test on mobile devices
- [ ] Test document signing flow

---

## Quick Start Summary

**What's already done:**
- ✅ Dual-write implemented in landing page JS
- ✅ Onboarding app with light slate theme
- ✅ Demo mode for testing
- ✅ Session storage data flow between pages

**What you need to implement:**

| Endpoint | Purpose | Priority |
|----------|---------|----------|
| `POST /hubspot-onboarding-hook` | Store partner journey data | **Critical** (already being called!) |
| `GET /hubspot-onboarding-hook?email=` | Return stored partner data | **Critical** |
| `POST /api/kyc` | KYC verification | **Critical** (can auto-approve for MVP) |
| `POST /api/billing` | Stripe customer + subscription | **Critical** |
| `POST /api/sign/create-envelope` | DocuSign envelope creation | **Required** |
| `POST /api/sign/webhook` | DocuSign completion callback | **Required** |
| `POST /api/provision` | UAS org + user creation | **Critical** |

**Provisioning must:**
- Call UAS `createReseller` to create partner organization
- Call UAS `createUser` with `Partner_Admin` role
- Activate Stripe subscription
- Send welcome email with login credentials

**External setup required:**
- [ ] Stripe account + subscription products
- [ ] DocuSign account + 8 document templates
- [ ] UAS M2M credentials
- [ ] Email service (SendGrid) for welcome emails
- [ ] DNS: `onboarding.wanaware.com` → Vercel

---

## Support

For questions about production deployment, contact the engineering team.
