import { ref } from 'vue';
import {
    getPublicNavVisibility,
    getPublicContactHero,
    getPublicBookPage
} from '../services/api.js';

export const showContactNav = ref(true);
export const showBookNav = ref(true);

let loadPromise = null;

export function invalidateStorefrontNav() {
    loadPromise = null;
}

function applyNavFlags(contact, book) {
    if (contact && typeof contact === 'object') {
        showContactNav.value = contact.show_in_nav !== false;
    }
    if (book && typeof book === 'object') {
        showBookNav.value = book.show_in_nav !== false;
    }
}

async function loadNavVisibility() {
    try {
        const data = await getPublicNavVisibility();
        showContactNav.value = data.contact !== false;
        showBookNav.value = data.book !== false;
        return;
    } catch {
        /* fall back to individual site settings endpoints */
    }

    const [contactResult, bookResult] = await Promise.allSettled([
        getPublicContactHero(),
        getPublicBookPage()
    ]);

    applyNavFlags(
        contactResult.status === 'fulfilled' ? contactResult.value : null,
        bookResult.status === 'fulfilled' ? bookResult.value : null
    );
}

export function ensureStorefrontNavLoaded() {
    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = loadNavVisibility().finally(() => {
        loadPromise = null;
    });

    return loadPromise;
}

export function useStorefrontNav() {
    ensureStorefrontNavLoaded();
    return { showContactNav, showBookNav };
}
