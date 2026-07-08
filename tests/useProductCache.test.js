/**
 * @jest-environment jsdom
 */

jest.mock('../frontend/src/services/api.js', () => ({
  getProductBySlug: jest.fn()
}));

const { getProductBySlug } = require('../frontend/src/services/api.js');
const {
  __resetProductCacheForTests,
  fetchProduct,
  getCachedProduct,
  hasProductChanged,
  prefetchProduct,
  seedProductCache,
  setCachedProduct
} = require('../frontend/src/composables/useProductCache.js');

describe('useProductCache', () => {
  beforeEach(() => {
    __resetProductCacheForTests();
    getProductBySlug.mockReset();
  });

  it('seeds and reads cached products', () => {
    seedProductCache([{ slug: 'alpha', title: 'Alpha' }]);
    expect(getCachedProduct('alpha')).toEqual({ slug: 'alpha', title: 'Alpha' });
  });

  it('deduplicates in-flight product fetches', async () => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    getProductBySlug.mockReturnValue(fetchPromise);

    const first = prefetchProduct('beta');
    const second = prefetchProduct('beta');

    expect(first).toBe(second);
    expect(getProductBySlug).toHaveBeenCalledTimes(1);

    resolveFetch({ slug: 'beta', title: 'Beta' });
    await expect(first).resolves.toEqual({ slug: 'beta', title: 'Beta' });
    expect(getCachedProduct('beta')).toEqual({ slug: 'beta', title: 'Beta' });
  });

  it('detects meaningful product changes', () => {
    const current = {
      slug: 'piece',
      price_cents: 1000,
      quantity_available: 2,
      description: 'Old',
      product_images: [{ _id: '1', image_url: 'https://example.com/a.jpg' }]
    };
    const fresh = {
      ...current,
      description: 'New'
    };

    expect(hasProductChanged(current, fresh)).toBe(true);
    expect(hasProductChanged(current, current)).toBe(false);
  });

  it('fetchProduct returns cached data without calling the API', async () => {
    setCachedProduct('cached', { slug: 'cached', title: 'Cached' });

    await expect(fetchProduct('cached')).resolves.toEqual({ slug: 'cached', title: 'Cached' });
    expect(getProductBySlug).not.toHaveBeenCalled();
  });
});
