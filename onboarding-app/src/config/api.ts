/**
 * API Configuration
 * Centralizes all API endpoints for the onboarding app
 */

// Get base URL from environment variable, fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Partner API Endpoints
export const API_ENDPOINTS = {
  // KYC Endpoints
  KYC_CREATE_SESSION: `${API_BASE_URL}/api/partner/kyc/create-session`,
  KYC_STATUS: (applicantId: string) => `${API_BASE_URL}/api/partner/kyc/status?applicantId=${applicantId}`,
  KYC_ADDRESS_VERIFY: `${API_BASE_URL}/api/partner/verify/us-address`,
  KYC_ADDRESS_COORDINATES: `${API_BASE_URL}/api/partner/kyc/address-coordinates`,
  
  // DocuSign Endpoints
  DOCUSIGN_CREATE_ENVELOPE: `${API_BASE_URL}/api/partner/sign/create-envelope`,
  DOCUSIGN_STATUS: (envelopeId: string) => `${API_BASE_URL}/api/partner/sign/status?envelopeId=${envelopeId}`,
  
  // Provision Endpoint
  PROVISION_PARTNER: `${API_BASE_URL}/api/partner/provision`,
};

export default API_ENDPOINTS;
