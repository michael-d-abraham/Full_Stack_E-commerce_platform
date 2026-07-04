import { ref, computed } from 'vue';
import { getPublicSiteBranding } from '../services/api.js';
import { DEFAULT_SITE_NAME, resolveSiteBranding } from '@shared/siteBrandDefaults.js';

export const siteName = ref(DEFAULT_SITE_NAME);
export const siteNameMode = ref('text');
export const siteNameLogoUrl = ref('');

let loadPromise = null;

export function invalidateSiteBrand() {
    loadPromise = null;
}

export function setBrandingFromStored(data) {
    const branding = resolveSiteBranding(data || {});
    siteName.value = branding.site_name;
    siteNameMode.value = branding.site_name_mode;
    siteNameLogoUrl.value = branding.site_name_logo_url;
}

/** @deprecated Use setBrandingFromStored */
export function setSiteNameFromStored(stored) {
    if (stored && typeof stored === 'object') {
        setBrandingFromStored(stored);
        return;
    }
    setBrandingFromStored({ site_name: stored });
}

async function loadSiteBrand() {
    try {
        const data = await getPublicSiteBranding();
        setBrandingFromStored(data);
    } catch {
        setBrandingFromStored({});
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

    const usesImageBrand = computed(
        () => siteNameMode.value === 'image' && Boolean(siteNameLogoUrl.value)
    );
    const brandHomeAriaLabel = computed(() => `${siteName.value} home`);
    const brandAdminHomeAriaLabel = computed(() => `${siteName.value} admin home`);

    return {
        siteName,
        siteNameMode,
        siteNameLogoUrl,
        usesImageBrand,
        brandHomeAriaLabel,
        brandAdminHomeAriaLabel
    };
}
