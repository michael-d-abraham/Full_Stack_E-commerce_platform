const {
  fitGalleryArtDimensions,
  getGalleryArtOrientation,
  resolveGalleryArtMax
} = require('../frontend/src/composables/useGalleryArtOrientation.js');

describe('useGalleryArtOrientation helpers', () => {
  describe('getGalleryArtOrientation', () => {
    it('classifies landscape, portrait, and square ratios', () => {
      expect(getGalleryArtOrientation(1600, 1200)).toBe('gallery-art--landscape');
      expect(getGalleryArtOrientation(900, 1200)).toBe('gallery-art--portrait');
      expect(getGalleryArtOrientation(1000, 1000)).toBe('gallery-art--square');
    });
  });

  describe('resolveGalleryArtMax', () => {
    it('resolves px values and min() expressions', () => {
      expect(resolveGalleryArtMax('320px', 800)).toBe(320);
      expect(resolveGalleryArtMax('min(480px, 100%)', 360)).toBe(360);
      expect(resolveGalleryArtMax('min(380px, calc(100% - 24px))', 500)).toBe(380);
      expect(resolveGalleryArtMax('min(380px, calc(100% - 24px))', 300)).toBe(276);
    });
  });

  describe('fitGalleryArtDimensions', () => {
    it('preserves aspect ratio within max bounds', () => {
      expect(fitGalleryArtDimensions(800, 1200, 320, 420)).toEqual({
        width: 280,
        height: 420
      });
      expect(fitGalleryArtDimensions(1600, 900, 480, 340)).toEqual({
        width: 480,
        height: 270
      });
    });
  });
});
