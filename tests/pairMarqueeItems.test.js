const { pairMarqueeItems } = require('../frontend/src/utils/pairMarqueeItems.js');

describe('pairMarqueeItems', () => {
  it('merges each image with a matching review card', () => {
    const images = [
      { id: 'a', src: '/a.jpg', alt: 'a' },
      { id: 'b', src: '/b.jpg', alt: 'b' }
    ];
    const quotes = [
      { id: '1', quote: 'one', name: 'alex', role: 'client' },
      { id: '2', quote: 'two', name: 'sam', role: 'client' }
    ];

    expect(pairMarqueeItems(images, quotes)).toEqual([
      {
        id: 'a--1',
        variant: 'paired',
        src: '/a.jpg',
        alt: 'a',
        quote: 'one',
        name: 'alex',
        role: 'client'
      },
      {
        id: 'b--2',
        variant: 'paired',
        src: '/b.jpg',
        alt: 'b',
        quote: 'two',
        name: 'sam',
        role: 'client'
      }
    ]);
  });

  it('cycles the shorter list when lengths differ', () => {
    const images = [{ id: 'a', src: '/a.jpg', alt: 'a' }];
    const quotes = [
      { id: '1', quote: 'one', name: 'alex', role: 'client' },
      { id: '2', quote: 'two', name: 'sam', role: 'client' }
    ];

    expect(pairMarqueeItems(images, quotes)).toHaveLength(2);
    expect(pairMarqueeItems(images, quotes)[1].src).toBe('/a.jpg');
    expect(pairMarqueeItems(images, quotes)[1].quote).toBe('two');
  });

  it('returns an empty list when either side is missing', () => {
    expect(pairMarqueeItems([], [{ id: '1' }])).toEqual([]);
    expect(pairMarqueeItems([{ id: 'a' }], [])).toEqual([]);
  });
});
