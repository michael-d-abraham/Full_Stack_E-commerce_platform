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
