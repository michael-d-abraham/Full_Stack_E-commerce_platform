/**
 * @jest-environment jsdom
 */

jest.mock('../frontend/src/services/api.js', () => ({
  getProductBySlug: jest.fn(),
  getProducts: jest.fn()
}));

const { getProductBySlug } = require('../frontend/src/services/api.js');
const {
  __resetProductCacheForTests,
  fetchProduct,
  getCachedProduct,
  hasProductChanged,
  isProductDetailComplete,
  prefetchProduct,
  refreshProductInBackground,
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
    expect(isProductDetailComplete('alpha')).toBe(false);
  });

  it('does not let slim list seeds overwrite complete detail', () => {
    setCachedProduct('alpha', {
      slug: 'alpha',
      title: 'Alpha',
      product_images: [
        { _id: '1', image_url: 'https://example.com/a.jpg' },
        { _id: '2', image_url: 'https://example.com/b.jpg' }
      ]
    });
    seedProductCache([
      {
        slug: 'alpha',
        title: 'Alpha',
        product_images: [{ _id: '1', image_url: 'https://example.com/a.jpg' }]
      }
    ]);
    expect(getCachedProduct('alpha').product_images).toHaveLength(2);
    expect(isProductDetailComplete('alpha')).toBe(true);
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
    expect(isProductDetailComplete('beta')).toBe(true);
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

  it('detects image-set changes even when updated_at matches', () => {
    const updatedAt = '2026-07-10T00:00:00.000Z';
    const slim = {
      slug: 'piece',
      updated_at: updatedAt,
      product_images: [{ _id: '1', image_url: 'https://example.com/a.jpg' }]
    };
    const full = {
      slug: 'piece',
      updated_at: updatedAt,
      product_images: [
        { _id: '1', image_url: 'https://example.com/a.jpg' },
        { _id: '2', image_url: 'https://example.com/b.jpg' }
      ]
    };

    expect(hasProductChanged(slim, full)).toBe(true);
  });

  it('fetchProduct returns complete cached data without calling the API', async () => {
    setCachedProduct('cached', { slug: 'cached', title: 'Cached' });

    await expect(fetchProduct('cached')).resolves.toEqual({ slug: 'cached', title: 'Cached' });
    expect(getProductBySlug).not.toHaveBeenCalled();
  });

  it('fetchProduct refetches when only a slim list stub is cached', async () => {
    seedProductCache([
      {
        slug: 'slim',
        title: 'Slim',
        product_images: [{ _id: '1', image_url: 'https://example.com/a.jpg' }]
      }
    ]);
    const full = {
      slug: 'slim',
      title: 'Slim',
      product_images: [
        { _id: '1', image_url: 'https://example.com/a.jpg' },
        { _id: '2', image_url: 'https://example.com/b.jpg' }
      ]
    };
    getProductBySlug.mockResolvedValue(full);

    await expect(fetchProduct('slim')).resolves.toEqual(full);
    expect(getProductBySlug).toHaveBeenCalledTimes(1);
    expect(isProductDetailComplete('slim')).toBe(true);
  });

  it('refreshProductInBackground notifies when slim cache gains images', async () => {
    seedProductCache([
      {
        slug: 'piece',
        updated_at: '2026-07-10T00:00:00.000Z',
        product_images: [{ _id: '1', image_url: 'https://example.com/a.jpg' }]
      }
    ]);
    const full = {
      slug: 'piece',
      updated_at: '2026-07-10T00:00:00.000Z',
      product_images: [
        { _id: '1', image_url: 'https://example.com/a.jpg' },
        { _id: '2', image_url: 'https://example.com/b.jpg' }
      ]
    };
    getProductBySlug.mockResolvedValue(full);
    const onUpdate = jest.fn();

    await refreshProductInBackground('piece', onUpdate);

    expect(onUpdate).toHaveBeenCalledWith(full);
  });
});
