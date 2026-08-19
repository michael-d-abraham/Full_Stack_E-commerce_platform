import {
  GALLERY_NAV_LABEL,
  GALLERY_PAGE_TITLE,
  GALLERY_SECTION_LABEL,
  GALLERY_EMPTY_MESSAGE,
  WANNA_DOS_NAV_LABEL,
  WANNA_DOS_PAGE_TITLE,
  WANNA_DOS_SECTION_LABEL,
  WANNA_DOS_EMPTY_MESSAGE,
  DEFAULT_SHOW_CART
} from '@shared/storefrontDefaults.js';

function resolveShowCartFromEnv() {
  const flag = import.meta.env.VITE_STOREFRONT_SHOW_CART;
  if (flag === 'true') {
    return true;
  }
  if (flag === 'false') {
    return false;
  }
  return DEFAULT_SHOW_CART;
}

export function useStorefrontLabels() {
  return {
    galleryNavLabel: GALLERY_NAV_LABEL,
    galleryPageTitle: GALLERY_PAGE_TITLE,
    gallerySectionLabel: GALLERY_SECTION_LABEL,
    galleryEmptyMessage: GALLERY_EMPTY_MESSAGE,
    wannaDosNavLabel: WANNA_DOS_NAV_LABEL,
    wannaDosPageTitle: WANNA_DOS_PAGE_TITLE,
    wannaDosSectionLabel: WANNA_DOS_SECTION_LABEL,
    wannaDosEmptyMessage: WANNA_DOS_EMPTY_MESSAGE,
    showCart: resolveShowCartFromEnv()
  };
}
