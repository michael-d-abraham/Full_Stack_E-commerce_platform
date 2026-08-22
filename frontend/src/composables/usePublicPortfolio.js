import { ref } from 'vue';
import { getPortfolio } from '../services/api.js';
import { createSwrCache } from './createSwrCache.js';

const portfolioCache = createSwrCache({
  storageKey: 'artist-portfolio-public-portfolio',
  storage: typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  ttlMs: 1000 * 60 * 10
});

function normalizeWorks(list) {
  return Array.isArray(list) ? list : [];
}

const works = ref(normalizeWorks(portfolioCache.getCached()));

export function usePublicPortfolio() {
  async function ensurePortfolio() {
    try {
      const list = await portfolioCache.ensure(() => getPortfolio(), {
        onUpdate(data) {
          works.value = normalizeWorks(data);
        }
      });
      works.value = normalizeWorks(list);
    } catch {
      /* keep cached / empty */
    }
    return works.value;
  }

  return { works, ensurePortfolio };
}
