import { ref, computed } from 'vue';
import { getPublicSiteBranding } from '../services/api.js';
import {
    DEFAULT_SITE_NAME,
    BRAND_DISPLAY_IMAGE,
    resolveSiteName,
    resolveBrandDisplayMode
} from '@shared/siteBrandDefaults.js';

export const siteName = ref(DEFAULT_SITE_NAME);
export const brandDisplayMode = ref('text');
export const siteLogoUrl = ref('');

let loadPromise = null;

export function invalidateSiteBrand() {
    loadPromise = null;
}

export function setSiteBrandFromStored(data) {
    const storedName = data?.site_name;
    siteName.value = resolveSiteName(storedName);
    brandDisplayMode.value = resolveBrandDisplayMode(data?.brand_display_mode, data?.site_logo_url);
    siteLogoUrl.value =
        brandDisplayMode.value === BRAND_DISPLAY_IMAGE && data?.site_logo_url
            ? String(data.site_logo_url).trim()
            : '';
}

/** @deprecated Use setSiteBrandFromStored */
export function setSiteNameFromStored(stored) {
    setSiteBrandFromStored({ site_name: stored });
}

async function loadSiteBrand() {
    try {
        const data = await getPublicSiteBranding();
        setSiteBrandFromStored(data);
    } catch {
        siteName.value = DEFAULT_SITE_NAME;
        brandDisplayMode.value = 'text';
        siteLogoUrl.value = '';
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

    const showBrandLogo = computed(
        () => brandDisplayMode.value === BRAND_DISPLAY_IMAGE && Boolean(siteLogoUrl.value)
    );
    const brandHomeAriaLabel = computed(() => `${siteName.value} home`);
    const brandAdminHomeAriaLabel = computed(() => `${siteName.value} admin home`);

    return {
        siteName,
        brandDisplayMode,
        siteLogoUrl,
        showBrandLogo,
        brandHomeAriaLabel,
        brandAdminHomeAriaLabel
    };
}
