import { ref } from 'vue';
import { getPublicBookPage } from '../services/api.js';
import { applyBookPageDefaults, DEFAULT_BOOK_PAGE } from '../constants/bookPageDefaults.js';
import { createSwrCache } from './createSwrCache.js';

const BOOK_KEY = 'artist-portfolio-book-page';

const bookCache = createSwrCache({
  storageKey: BOOK_KEY,
  storage: typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  ttlMs: 1000 * 60 * 60
});

function toView(data) {
  return applyBookPageDefaults(data || DEFAULT_BOOK_PAGE);
}

const page = ref(toView(bookCache.getCached() || DEFAULT_BOOK_PAGE));

export function useBookPage() {
  async function ensureBookPage() {
    try {
      const data = await bookCache.ensure(() => getPublicBookPage(), {
        onUpdate(next) {
          page.value = toView(next);
        }
      });
      page.value = toView(data);
    } catch {
      /* keep defaults / cache */
    }
    return page.value;
  }

  return { page, ensureBookPage };
}
