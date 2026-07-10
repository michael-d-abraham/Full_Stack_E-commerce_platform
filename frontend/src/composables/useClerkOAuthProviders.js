import { computed } from 'vue';
import { useClerk } from '@clerk/vue';
import { OAUTH_PROVIDERS, getOAuthProviderData } from '@clerk/shared/oauth';

function readSocialSettings(clerk) {
    if (!clerk) {
        return null;
    }
    return (
        clerk.__unstable__environment?.userSettings?.social ||
        clerk.environment?.userSettings?.social ||
        null
    );
}

/**
 * OAuth providers enabled in the Clerk Dashboard (Google, etc.).
 * Falls back to Google when settings are not yet available so Gmail sign-in stays visible.
 */
export function useClerkOAuthProviders() {
    const clerk = useClerk();

    const providers = computed(() => {
        const social = readSocialSettings(clerk.value);

        if (social && typeof social === 'object') {
            const enabled = Object.values(social)
                .filter((entry) => entry && entry.enabled && entry.strategy)
                .map((entry) => {
                    const meta = getOAuthProviderData({ strategy: entry.strategy });
                    return {
                        strategy: entry.strategy,
                        name: entry.name || meta?.name || entry.strategy.replace(/^oauth_/, ''),
                        provider: meta?.provider || entry.strategy.replace(/^oauth_/, '')
                    };
                });

            enabled.sort((a, b) => {
                if (a.strategy === 'oauth_google') return -1;
                if (b.strategy === 'oauth_google') return 1;
                return String(a.name).localeCompare(String(b.name));
            });

            if (enabled.length) {
                return enabled;
            }
        }

        // Known-enabled fallback while Clerk environment loads (matches prior widget).
        const google = getOAuthProviderData({ strategy: 'oauth_google' });
        return [
            {
                strategy: 'oauth_google',
                name: google?.name || 'Google',
                provider: 'google'
            }
        ];
    });

    const knownProviders = OAUTH_PROVIDERS;

    return { providers, knownProviders, clerk };
}
