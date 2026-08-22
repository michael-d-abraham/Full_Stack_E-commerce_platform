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

export const FOOTER_SECTION_IDS = new Set([
  STOREFRONT_SECTION.contact,
  STOREFRONT_SECTION.book
]);

export function storefrontHash(sectionId) {
  return `#${sectionId}`;
}
