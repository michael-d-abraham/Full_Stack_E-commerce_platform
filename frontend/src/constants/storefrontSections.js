export const STOREFRONT_SECTION = {
  landing: 'landing',
  about: 'about',
  aboutMe: 'about-me',
  myArt: 'my-art',
  gallery: 'gallery',
  wannaDos: 'wanna-dos',
  contact: 'contact',
  book: 'book'
};

export const STOREFRONT_NAV = {
  me: 'me',
  myArt: 'my-art',
  sayHi: 'say-hi'
};

export const STOREFRONT_NAV_LABELS = {
  [STOREFRONT_NAV.me]: 'artist',
  [STOREFRONT_NAV.myArt]: 'portfolio',
  [STOREFRONT_NAV.sayHi]: 'contact'
};

export const FOOTER_SECTION_IDS = new Set([
  STOREFRONT_NAV.sayHi,
  STOREFRONT_SECTION.contact,
  STOREFRONT_SECTION.book
]);

const SECTION_TO_NAV = {
  [STOREFRONT_NAV.me]: STOREFRONT_NAV.me,
  [STOREFRONT_SECTION.landing]: STOREFRONT_NAV.me,
  [STOREFRONT_SECTION.about]: STOREFRONT_NAV.me,
  [STOREFRONT_SECTION.aboutMe]: STOREFRONT_NAV.me,
  [STOREFRONT_NAV.myArt]: STOREFRONT_NAV.myArt,
  [STOREFRONT_SECTION.gallery]: STOREFRONT_NAV.myArt,
  [STOREFRONT_SECTION.wannaDos]: STOREFRONT_NAV.myArt,
  [STOREFRONT_NAV.sayHi]: STOREFRONT_NAV.sayHi,
  [STOREFRONT_SECTION.contact]: STOREFRONT_NAV.sayHi,
  [STOREFRONT_SECTION.book]: STOREFRONT_NAV.sayHi
};

export function resolveStorefrontNavId(sectionId) {
  return SECTION_TO_NAV[sectionId] || null;
}

export function resolveStorefrontScrollTarget(sectionId) {
  const navId = resolveStorefrontNavId(sectionId);
  if (navId === STOREFRONT_NAV.me) {
    return STOREFRONT_NAV.me;
  }
  if (navId === STOREFRONT_NAV.myArt) {
    return STOREFRONT_SECTION.myArt;
  }
  if (navId === STOREFRONT_NAV.sayHi) {
    return STOREFRONT_NAV.sayHi;
  }
  return sectionId;
}

export function storefrontHash(sectionId) {
  return `#${sectionId}`;
}
