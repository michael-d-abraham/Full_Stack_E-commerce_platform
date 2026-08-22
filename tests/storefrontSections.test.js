const {
  STOREFRONT_NAV,
  STOREFRONT_SECTION,
  resolveStorefrontNavId,
  resolveStorefrontScrollTarget
} = require('../frontend/src/constants/storefrontSections.js');

describe('storefrontSections', () => {
  it('folds home, about, and about me into me at the top of the page', () => {
    expect(resolveStorefrontNavId(STOREFRONT_SECTION.landing)).toBe(STOREFRONT_NAV.me);
    expect(resolveStorefrontNavId(STOREFRONT_SECTION.about)).toBe(STOREFRONT_NAV.me);
    expect(resolveStorefrontNavId(STOREFRONT_SECTION.aboutMe)).toBe(STOREFRONT_NAV.me);
    expect(resolveStorefrontScrollTarget(STOREFRONT_SECTION.about)).toBe(STOREFRONT_NAV.me);
  });

  it('folds gallery and wanna-dos into my art', () => {
    expect(resolveStorefrontNavId(STOREFRONT_SECTION.gallery)).toBe(STOREFRONT_NAV.myArt);
    expect(resolveStorefrontNavId(STOREFRONT_SECTION.wannaDos)).toBe(STOREFRONT_NAV.myArt);
    expect(resolveStorefrontScrollTarget(STOREFRONT_SECTION.gallery)).toBe(STOREFRONT_SECTION.myArt);
    expect(resolveStorefrontScrollTarget(STOREFRONT_SECTION.wannaDos)).toBe(STOREFRONT_SECTION.myArt);
  });

  it('folds contact and book into say hi', () => {
    expect(resolveStorefrontNavId(STOREFRONT_SECTION.contact)).toBe(STOREFRONT_NAV.sayHi);
    expect(resolveStorefrontNavId(STOREFRONT_SECTION.book)).toBe(STOREFRONT_NAV.sayHi);
    expect(resolveStorefrontScrollTarget(STOREFRONT_SECTION.contact)).toBe(STOREFRONT_NAV.sayHi);
  });
});
