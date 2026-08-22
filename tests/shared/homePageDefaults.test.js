const {
    FEATURED_PRODUCT_SLOTS,
    DEFAULT_HOME_PAGE,
    emptyFeaturedProduct,
    resolveHeroImageUrls,
    resolveHeroImageFileIds,
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

    it('resolveHeroImageFileIds aligns file IDs to hero URLs', () => {
        expect(
            resolveHeroImageFileIds({
                hero_image_urls: ['https://example.com/one.jpg', 'https://example.com/two.jpg'],
                hero_image_file_ids: ['file_one', 'file_two']
            })
        ).toEqual(['file_one', 'file_two']);
    });

    it('resolveHeroImageFileIds falls back to legacy hero_image_file_id', () => {
        expect(
            resolveHeroImageFileIds({
                hero_image_url: 'https://example.com/legacy.jpg',
                hero_image_file_id: 'file_legacy'
            })
        ).toEqual(['file_legacy']);
    });

    it('resolveHeroImageFileIds returns empty strings when file IDs are missing', () => {
        expect(
            resolveHeroImageFileIds({
                hero_image_urls: ['https://example.com/one.jpg']
            })
        ).toEqual(['']);
    });

    it('mergeHomePageTextDefaults keeps hero_quote and about_header independent', () => {
        const merged = mergeHomePageTextDefaults({
            hero_quote: 'Hero line',
            about_header: 'About line'
        });
        expect(merged.hero_quote).toBe('Hero line');
        expect(merged.about_header).toBe('About line');
    });

    it('mergeHomePageTextDefaults includes about-me pair urls', () => {
        const merged = mergeHomePageTextDefaults({
            about_me_left_image_url: 'https://example.com/left.jpg',
            about_me_right_image_url: 'https://example.com/right.jpg'
        });
        expect(merged.about_me_left_image_url).toBe('https://example.com/left.jpg');
        expect(merged.about_me_right_image_url).toBe('https://example.com/right.jpg');
    });

    it('mergeHomePageTextDefaults includes the .lines hero photo', () => {
        const merged = mergeHomePageTextDefaults({
            hero_lines_image_url: 'https://example.com/lines.jpg'
        });
        expect(merged.hero_lines_image_url).toBe('https://example.com/lines.jpg');
    });

    it('mergeHomePageTextDefaults does not copy about_header into hero_quote', () => {
        const merged = mergeHomePageTextDefaults({
            about_header: 'About only'
        });
        expect(merged.hero_quote).toBe(DEFAULT_HOME_PAGE.hero_quote);
        expect(merged.about_header).toBe('About only');
    });

    it('replaces the legacy hero quote with madd.lines', () => {
        const merged = mergeHomePageTextDefaults({
            hero_quote: 'Art is how we decorate space. Music is how we decorate time.'
        });
        expect(merged.hero_quote).toBe('madd.lines');
    });
});
