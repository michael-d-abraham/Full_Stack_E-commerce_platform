const { GALLERY_WORK_LABELS, isValidGalleryWorkLabel } = require('../../shared/galleryLabels');
const { portfolioTitle } = require('../../shared/portfolioDisplay');

describe('galleryLabels', () => {
    it('lists the fixed gallery style labels', () => {
        expect(GALLERY_WORK_LABELS).toEqual([
            'Blackwork',
            'Fine line',
            'Realism',
            'Shading',
            'Color',
            'Floral'
        ]);
    });

    it('validates allowed labels', () => {
        expect(isValidGalleryWorkLabel('Fine line')).toBe(true);
        expect(isValidGalleryWorkLabel('Watercolor')).toBe(false);
    });
});

describe('portfolioTitle', () => {
    it('prefers label over legacy title', () => {
        expect(
            portfolioTitle({ label: 'Realism', title: 'Floral forearm', slug: 'floral-forearm' })
        ).toBe('Realism');
    });
});
