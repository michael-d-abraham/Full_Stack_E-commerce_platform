import { ref } from 'vue';
import { getPublicContactHero } from '../services/api.js';
import { applyContactPageDefaults } from '../constants/contactPageDefaults.js';
import { createSwrCache } from './createSwrCache.js';
import { buildImageKitSrc } from '../utils/imageKitUrl.js';

const CONTACT_KEY = 'artist-portfolio-contact-page';

const contactCache = createSwrCache({
  storageKey: CONTACT_KEY,
  storage: typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  ttlMs: 1000 * 60 * 60
});

function toView(data) {
  const config = applyContactPageDefaults({
    ...data,
    contact_hero_image_url: data?.image_url || data?.contact_hero_image_url || ''
  });
  const rawUrl = config.contact_hero_image_url;
  return {
    ...config,
    heroImageUrl: rawUrl ? buildImageKitSrc(rawUrl, { width: 1200, quality: 80 }) : ''
  };
}

const page = ref(toView(contactCache.getCached() || {}));

export function useContactPage() {
  async function ensureContactPage() {
    try {
      const data = await contactCache.ensure(() => getPublicContactHero(), {
        onUpdate(next) {
          page.value = toView(next);
        }
      });
      page.value = toView(data);
    } catch {
      if (!contactCache.hasCache()) {
        page.value = toView({});
      }
    }
    return page.value;
  }

  return { page, ensureContactPage };
}
