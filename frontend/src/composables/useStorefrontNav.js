import { ref } from 'vue';
import {
  getPublicNavVisibility,
  getPublicContactHero,
  getPublicBookPage
} from '../services/api.js';
import { createSwrCache } from './createSwrCache.js';

const NAV_STORAGE_KEY = 'artist-portfolio-storefront-nav';
const NAV_TTL_MS = 1000 * 60 * 60 * 6; // 6h

export const showContactNav = ref(true);
export const showBookNav = ref(true);

const navCache = createSwrCache({
  storageKey: NAV_STORAGE_KEY,
  ttlMs: NAV_TTL_MS,
  hasChanged(a, b) {
    const left = normalizeNav(a);
    const right = normalizeNav(b);
    return left.contact !== right.contact || left.book !== right.book;
  }
});

function normalizeNav(data) {
  const base = data && typeof data === 'object' ? data : {};
  return {
    contact: base.contact !== false,
    book: base.book !== false
  };
}

function applyNav(data) {
  const flags = normalizeNav(data);
  showContactNav.value = flags.contact;
  showBookNav.value = flags.book;
}

function applyNavFlags(contact, book) {
  const next = {
    contact: true,
    book: true
  };
  if (contact && typeof contact === 'object') {
    next.contact = contact.show_in_nav !== false;
  }
  if (book && typeof book === 'object') {
    next.book = book.show_in_nav !== false;
  }
  return next;
}

// Synchronous hydrate from localStorage before first paint.
const initialCached = navCache.getCached();
if (initialCached) {
  applyNav(initialCached);
}

export function invalidateStorefrontNav() {
  navCache.invalidate();
}

export function hasStorefrontNavCache() {
  return navCache.hasCache();
}

async function fetchNavVisibility() {
  try {
    const data = await getPublicNavVisibility();
    return {
      contact: data.contact !== false,
      book: data.book !== false
    };
  } catch {
    /* fall back to individual site settings endpoints */
  }

  const [contactResult, bookResult] = await Promise.allSettled([
    getPublicContactHero(),
    getPublicBookPage()
  ]);

  return applyNavFlags(
    contactResult.status === 'fulfilled' ? contactResult.value : null,
    bookResult.status === 'fulfilled' ? bookResult.value : null
  );
}

export function ensureStorefrontNavLoaded() {
  return navCache
    .ensure(fetchNavVisibility, {
      onUpdate(data) {
        applyNav(data);
      }
    })
    .then((data) => {
      applyNav(data);
      return data;
    });
}

export function useStorefrontNav() {
  ensureStorefrontNavLoaded();
  return { showContactNav, showBookNav };
}
