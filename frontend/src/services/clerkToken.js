/**
 * Browser-only Clerk session token helper for authenticated admin API calls.
 */
import { getToken } from '@clerk/vue';

export async function getClerkSessionToken() {
    try {
        return await getToken();
    } catch {
        return null;
    }
}
