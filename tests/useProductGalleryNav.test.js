const { isHorizontalSwipe } = require('../frontend/src/composables/useProductGalleryNav.js');

describe('useProductGalleryNav', () => {
  describe('isHorizontalSwipe', () => {
    it('accepts a clear horizontal swipe', () => {
      expect(isHorizontalSwipe(-60, 10)).toBe(true);
      expect(isHorizontalSwipe(60, -8)).toBe(true);
    });

    it('rejects vertical scrolling drift', () => {
      expect(isHorizontalSwipe(60, 120)).toBe(false);
      expect(isHorizontalSwipe(-55, 90)).toBe(false);
    });

    it('rejects short horizontal movement', () => {
      expect(isHorizontalSwipe(30, 0)).toBe(false);
    });
  });
});
