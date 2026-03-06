/**
 * Helper function to find email from localStorage by searching for keys with a specific suffix
 */
export const findEmailFromLocalStorage = (suffix: string = '_kycData'): { email: string; data: any } | null => {
    const allKeys = Object.keys(localStorage);
    
    for (const key of allKeys) {
        if (key.endsWith(suffix)) {
            const email = key.replace(suffix, '');
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    return { email, data: JSON.parse(stored) };
                } catch {
                    return null;
                }
            }
        }
    }
    
    return null;
};

/**
 * Get KYC data from URL email or fallback to localStorage search
 * @param urlEmail - Email from URL parameters
 * @param suffix - localStorage key suffix (default: '_kycData')
 * @returns Object with email and data, or null if not found
 */
export const getKycData = (urlEmail: string | null, suffix: string = '_kycData'): { email: string; data: any } | null => {
    if (urlEmail) {
        // Get from localStorage using URL email
        const stored = localStorage.getItem(`${urlEmail}${suffix}`);
        if (stored) {
            try {
                return { email: urlEmail, data: JSON.parse(stored) };
            } catch {
                // Invalid JSON
                return null;
            }
        }
    }
    // Fallback: find from localStorage
    return findEmailFromLocalStorage(suffix);
};
