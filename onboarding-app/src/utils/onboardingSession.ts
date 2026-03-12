const ACTIVE_ONBOARDING_EMAIL_KEY = 'activeOnboardingEmail';
const ACTIVE_PARTNER_DATA_KEY = 'activePartnerData';
const LEGACY_PARTNER_DATA_KEY = 'partnerData';

function safeParse<T>(value: string | null): T | null {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

export function getActiveOnboardingEmail(): string | null {
    const sessionEmail = sessionStorage.getItem(ACTIVE_ONBOARDING_EMAIL_KEY);

    if (sessionEmail) {
        return sessionEmail;
    }

    const partnerData = getSessionPartnerData<{ email?: string }>();
    return partnerData?.email || null;
}

export function setActiveOnboardingEmail(email: string) {
    sessionStorage.setItem(ACTIVE_ONBOARDING_EMAIL_KEY, email);
}

export function getSessionPartnerData<T>(): T | null {
    return (
        safeParse<T>(sessionStorage.getItem(ACTIVE_PARTNER_DATA_KEY)) ||
        safeParse<T>(sessionStorage.getItem(LEGACY_PARTNER_DATA_KEY))
    );
}

export function setActiveOnboardingSession<T extends { email: string }>(partnerData: T) {
    const serialized = JSON.stringify(partnerData);
    sessionStorage.setItem(ACTIVE_ONBOARDING_EMAIL_KEY, partnerData.email);
    sessionStorage.setItem(ACTIVE_PARTNER_DATA_KEY, serialized);
    sessionStorage.setItem(LEGACY_PARTNER_DATA_KEY, serialized);
}

export function clearActiveOnboardingSession() {
    sessionStorage.removeItem(ACTIVE_ONBOARDING_EMAIL_KEY);
    sessionStorage.removeItem(ACTIVE_PARTNER_DATA_KEY);
    sessionStorage.removeItem(LEGACY_PARTNER_DATA_KEY);
}
