import { ref, computed } from 'vue';
import { getPublicSiteBranding } from '../services/api.js';
import { DEFAULT_SITE_NAME, resolveSiteName } from '@shared/siteBrandDefaults.js';

export const siteName = ref(DEFAULT_SITE_NAME);

let loadPromise = null;

export function invalidateSiteBrand() {
    loadPromise = null;
}

export function setSiteNameFromStored(stored) {
    siteName.value = resolveSiteName(stored);
}

async function loadSiteBrand() {
    try {
        const data = await getPublicSiteBranding();
        setSiteNameFromStored(data?.site_name);
    } catch {
        siteName.value = DEFAULT_SITE_NAME;
    }
}

export function ensureSiteBrandLoaded() {
    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = loadSiteBrand().finally(() => {
        loadPromise = null;
    });

    return loadPromise;
}

export function useSiteBrand() {
    ensureSiteBrandLoaded();

    const brandHomeAriaLabel = computed(() => `${siteName.value} home`);
    const brandAdminHomeAriaLabel = computed(() => `${siteName.value} admin home`);

    return { siteName, brandHomeAriaLabel, brandAdminHomeAriaLabel };
}
