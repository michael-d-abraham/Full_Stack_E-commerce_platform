import { ref, computed } from 'vue';
import { getPublicSiteBranding } from '../services/api.js';
import { DEFAULT_SITE_NAME, resolveSiteBranding } from '@shared/siteBrandDefaults.js';
import { createSwrCache } from './createSwrCache.js';

const BRAND_STORAGE_KEY = 'artist-portfolio-site-brand';
const BRAND_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export const siteName = ref(DEFAULT_SITE_NAME);
export const siteNameMode = ref('text');
export const siteNameLogoUrl = ref('');

const brandCache = createSwrCache({
  storageKey: BRAND_STORAGE_KEY,
  ttlMs: BRAND_TTL_MS,
  hasChanged(a, b) {
    const left = resolveSiteBranding(a || {});
    const right = resolveSiteBranding(b || {});
    return (
      left.site_name !== right.site_name
      || left.site_name_mode !== right.site_name_mode
      || left.site_name_logo_url !== right.site_name_logo_url
    );
  }
});

function applyBranding(data) {
  const branding = resolveSiteBranding(data || {});
  siteName.value = branding.site_name;
  siteNameMode.value = branding.site_name_mode;
  siteNameLogoUrl.value = branding.site_name_logo_url;
}

// Synchronous hydrate from localStorage before first paint consumers run.
const initialCached = brandCache.getCached();
if (initialCached) {
  applyBranding(initialCached);
}

export function invalidateSiteBrand() {
  brandCache.invalidate();
}

export function setBrandingFromStored(data) {
  applyBranding(data);
  brandCache.setCached(data && typeof data === 'object' ? data : {});
}

/** @deprecated Use setBrandingFromStored */
export function setSiteNameFromStored(stored) {
  if (stored && typeof stored === 'object') {
    setBrandingFromStored(stored);
    return;
  }
  setBrandingFromStored({ site_name: stored });
}

export function hasSiteBrandCache() {
  return brandCache.hasCache();
}

export function ensureSiteBrandLoaded() {
  return brandCache.ensure(
    async () => {
      try {
        return await getPublicSiteBranding();
      } catch {
        return brandCache.getCached() || {};
      }
    },
    {
      onUpdate(data) {
        applyBranding(data);
      }
    }
  ).then((data) => {
    applyBranding(data);
    return data;
  });
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
