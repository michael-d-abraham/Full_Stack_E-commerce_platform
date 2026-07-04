const FEATURED_PRODUCT_SLOTS = 6;

const DEFAULT_HOME_PAGE = {
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    hero_image_urls: [],
    featured_title: 'Featured products',
    featured_products: Array.from({ length: FEATURED_PRODUCT_SLOTS }, () => ({
        product_id: ''
    })),
    about_title: 'About',
    about_header: 'Art is how we decorate space. Music is how we decorate time.',
    about_text: '',
    about_image_url: ''
};

function emptyFeaturedProduct() {
    return { product_id: '' };
}

function normalizeOptionalText(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
}

function resolveHeroImageUrls(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};
    const fromArray = Array.isArray(base.hero_image_urls)
        ? base.hero_image_urls.map((url) => normalizeOptionalText(url)).filter(Boolean)
        : [];

    if (fromArray.length > 0) {
        return fromArray;
    }

    const legacyUrl = normalizeOptionalText(base.hero_image_url);
    return legacyUrl ? [legacyUrl] : [];
}

function mergeHomePageTextDefaults(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};
    const hero_image_urls = resolveHeroImageUrls(base);
    const hero_image_url = hero_image_urls[0] || '';

    return {
        hero_title: normalizeOptionalText(base.hero_title),
        hero_subtitle: normalizeOptionalText(base.hero_subtitle),
        hero_image_url,
        hero_image_urls,
        featured_title:
            normalizeOptionalText(base.featured_title) || DEFAULT_HOME_PAGE.featured_title,
        about_title:
            normalizeOptionalText(base.about_title) || DEFAULT_HOME_PAGE.about_title,
        about_header:
            normalizeOptionalText(base.about_header) || DEFAULT_HOME_PAGE.about_header,
        about_text: normalizeOptionalText(base.about_text),
        about_image_url: normalizeOptionalText(base.about_image_url)
    };
}

module.exports = {
    FEATURED_PRODUCT_SLOTS,
    DEFAULT_HOME_PAGE,
    emptyFeaturedProduct,
    resolveHeroImageUrls,
    mergeHomePageTextDefaults
};
