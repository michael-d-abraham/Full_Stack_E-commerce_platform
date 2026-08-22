const {
  artworkFromWorks,
  padForLoop,
  artworkMarqueeDuration,
  resolveArtworkMarqueeItems
} = require('../frontend/src/utils/artworkMarqueeItems.js');

function work(id, { src, primary = true, label = 'Fine line' } = {}) {
  return {
    _id: id,
    label,
    portfolio_images: src
      ? [{ image_url: src, is_primary: primary, alt_text: `${label} tattoo` }]
      : []
  };
}

describe('artworkMarqueeItems', () => {
  describe('artworkFromWorks', () => {
    it('uses the primary portfolio image and skips works without photos', () => {
      const items = artworkFromWorks([
        work('a', { src: 'https://cdn.example/a.jpg' }),
        work('b', { src: '' }),
        { _id: 'c', label: 'Color', portfolio_images: [{ image_url: 'https://cdn.example/c.jpg', is_primary: false }] }
      ]);

      expect(items).toEqual([
        { id: 'a', src: 'https://cdn.example/a.jpg', alt: 'Fine line tattoo' },
        { id: 'c', src: 'https://cdn.example/c.jpg', alt: 'Color' }
      ]);
    });

    it('dedupes by work id', () => {
      const items = artworkFromWorks([
        work('a', { src: 'https://cdn.example/a.jpg' }),
        work('a', { src: 'https://cdn.example/a-copy.jpg' })
      ]);
      expect(items).toHaveLength(1);
    });
  });

  describe('padForLoop', () => {
    it('returns empty when there is no artwork', () => {
      expect(padForLoop([])).toEqual([]);
    });

    it('leaves a full set unchanged', () => {
      const source = Array.from({ length: 8 }, (_, i) => ({ id: String(i) }));
      expect(padForLoop(source, 8)).toBe(source);
    });

    it('repeats a short set so the track can loop at -50%', () => {
      const padded = padForLoop([{ id: 'a' }, { id: 'b' }], 5);
      expect(padded.map((item) => item.id)).toEqual(['a', 'b', 'a', 'b', 'a']);
    });
  });

  describe('resolveArtworkMarqueeItems', () => {
    const placeholders = [
      { id: 'ph-1', src: 'https://cdn.example/ph-1.jpg', alt: 'Placeholder' },
      { id: 'ph-2', src: 'https://cdn.example/ph-2.jpg', alt: 'Placeholder' }
    ];

    it('uses placeholders when the gallery is empty', () => {
      const items = resolveArtworkMarqueeItems([], placeholders);
      expect(items.map((item) => item.id)).toEqual(['ph-1', 'ph-2', 'ph-1', 'ph-2', 'ph-1', 'ph-2', 'ph-1', 'ph-2']);
    });

    it('prefers real gallery photos over placeholders', () => {
      const items = resolveArtworkMarqueeItems(
        [work('live', { src: 'https://cdn.example/live.jpg' })],
        placeholders
      );
      expect(items[0]).toMatchObject({ id: 'live', src: 'https://cdn.example/live.jpg' });
      expect(items.some((item) => item.id === 'ph-1')).toBe(false);
    });
  });

  describe('artworkMarqueeDuration', () => {
    it('keeps a slow floor and scales with item count', () => {
      expect(artworkMarqueeDuration(4)).toBe('45s');
      expect(artworkMarqueeDuration(12)).toBe('60s');
    });
  });
});
