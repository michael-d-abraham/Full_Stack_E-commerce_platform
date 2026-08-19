/**
 * Clerk is optional for local dev — set VITE_CLERK_PUBLISHABLE_KEY to enable.
 */
export function isClerkEnabled() {
    const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    return Boolean(key && String(key).trim());
}

export function getClerkPublishableKey() {
    if (!isClerkEnabled()) {
        return '';
    }
    return String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY).trim();
}
