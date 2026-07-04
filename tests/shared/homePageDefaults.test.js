const {
    FEATURED_PRODUCT_SLOTS,
    DEFAULT_HOME_PAGE,
    emptyFeaturedProduct,
    resolveHeroImageUrls,
    mergeHomePageTextDefaults
} = require('../../shared/homePageDefaults');

describe('shared/homePageDefaults', () => {
    it('FEATURED_PRODUCT_SLOTS is 6', () => {
        expect(FEATURED_PRODUCT_SLOTS).toBe(6);
    });

    it('emptyFeaturedProduct returns expected shape', () => {
        expect(emptyFeaturedProduct()).toEqual({ product_id: '' });
    });

    it('mergeHomePageTextDefaults applies title fallbacks', () => {
        const merged = mergeHomePageTextDefaults({});
        expect(merged.featured_title).toBe(DEFAULT_HOME_PAGE.featured_title);
        expect(merged.about_title).toBe(DEFAULT_HOME_PAGE.about_title);
        expect(merged.hero_title).toBe('');
    });

    it('mergeHomePageTextDefaults preserves custom titles', () => {
        const merged = mergeHomePageTextDefaults({
            featured_title: 'Shop picks',
            about_title: 'Our story'
        });
        expect(merged.featured_title).toBe('Shop picks');
        expect(merged.about_title).toBe('Our story');
    });

    it('resolveHeroImageUrls returns empty array when no images exist', () => {
        expect(resolveHeroImageUrls({})).toEqual([]);
        expect(resolveHeroImageUrls({ hero_image_url: '', hero_image_urls: [] })).toEqual([]);
    });

    it('resolveHeroImageUrls falls back to hero_image_url when array is empty', () => {
        expect(resolveHeroImageUrls({ hero_image_url: 'https://example.com/a.jpg' })).toEqual([
            'https://example.com/a.jpg'
        ]);
    });

    it('resolveHeroImageUrls prefers hero_image_urls over legacy hero_image_url', () => {
        expect(
            resolveHeroImageUrls({
                hero_image_url: 'https://example.com/legacy.jpg',
                hero_image_urls: ['https://example.com/one.jpg', 'https://example.com/two.jpg']
            })
        ).toEqual(['https://example.com/one.jpg', 'https://example.com/two.jpg']);
    });

    it('mergeHomePageTextDefaults keeps hero_quote and about_header independent', () => {
        const merged = mergeHomePageTextDefaults({
            hero_quote: 'Hero line',
            about_header: 'About line'
        });
        expect(merged.hero_quote).toBe('Hero line');
        expect(merged.about_header).toBe('About line');
    });

    it('mergeHomePageTextDefaults falls back hero_quote to about_header when unset', () => {
        const merged = mergeHomePageTextDefaults({
            about_header: 'Shared legacy quote'
        });
        expect(merged.hero_quote).toBe('Shared legacy quote');
        expect(merged.about_header).toBe('Shared legacy quote');
    });
});
