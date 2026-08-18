const {
    displayProductName,
    primaryProductImageUrl,
    primaryProductImage
} = require('../../shared/productDisplay');

describe('shared/productDisplay', () => {
    describe('displayProductName', () => {
        it('returns title only (format is not appended)', () => {
            expect(displayProductName({ title: 'Sunset' })).toBe('Sunset');
            expect(
                displayProductName({ title: 'Sunset', format: 'Canvas' })
            ).toBe('Sunset');
        });

        it('falls back to slug then Product', () => {
            expect(displayProductName({ slug: 'sunset-print' })).toBe('sunset-print');
            expect(displayProductName({})).toBe('Product');
        });
    });

    describe('primaryProductImageUrl', () => {
        it('returns null when no product or images', () => {
            expect(primaryProductImageUrl(null)).toBeNull();
            expect(primaryProductImageUrl({ product_images: [] })).toBeNull();
        });

        it('returns null when images have no URL', () => {
            expect(
                primaryProductImageUrl({
                    product_images: [{ image_url: '' }, { image_url: null }]
                })
            ).toBeNull();
        });

        it('prefers primary image', () => {
            const url = primaryProductImageUrl({
                product_images: [
                    { image_url: 'https://example.com/a.jpg' },
                    { image_url: 'https://example.com/b.jpg', is_primary: true }
                ]
            });
            expect(url).toBe('https://example.com/b.jpg');
        });

        it('falls back to first image with URL', () => {
            const url = primaryProductImageUrl({
                product_images: [{ image_url: 'https://example.com/a.jpg' }]
            });
            expect(url).toBe('https://example.com/a.jpg');
        });
    });

    describe('primaryProductImage', () => {
        it('returns image object or null', () => {
            const img = { image_url: 'https://example.com/a.jpg', is_primary: true };
            expect(primaryProductImage({ product_images: [img] })).toBe(img);
            expect(primaryProductImage({ product_images: [] })).toBeNull();
        });
    });
});
