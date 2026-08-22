/**
 * Browser-only Clerk session token helper for authenticated admin API calls.
 */
import { isClerkEnabled } from '../utils/clerkConfig.js';

export async function getClerkSessionToken() {
    if (!isClerkEnabled()) {
        return null;
    }
    const { getToken } = await import('@clerk/vue');
    try {
        return await getToken();
    } catch {
        return null;
    }
}

/**
 * Resolve a safe post-login admin path from router query.redirect.
 */
export function resolveAdminRedirectTarget(queryRedirect) {
    if (
        typeof queryRedirect === 'string' &&
        queryRedirect.startsWith('/admin') &&
        !queryRedirect.startsWith('/admin/login') &&
        !queryRedirect.startsWith('/admin/sign-up')
    ) {
        return queryRedirect;
    }
    return '/admin/dashboard';
}

/**
 * True when Clerk has an active session token in the browser.
 */
export async function hasClerkSessionToken() {
    return Boolean(await getClerkSessionToken());
}
