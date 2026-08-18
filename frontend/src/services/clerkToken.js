/**
 * Browser-only Clerk session token helper for authenticated admin API calls.
 */
import { isClerkEnabled } from '../utils/clerkConfig.js';

export async function getClerkSessionToken() {
    if (!isClerkEnabled()) {
        return null;
    }

    try {
        const { getToken } = await import('@clerk/vue');
        return await getToken();
    } catch {
        return null;
    }
}
