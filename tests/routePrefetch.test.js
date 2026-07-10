/**
 * @jest-environment node
 */

const {
  prefetchRouteChunk,
  prefetchRouteChunks,
  prefetchStorefrontRoutes
} = require('../frontend/src/utils/routePrefetch.js');

describe('routePrefetch', () => {
  it('does not throw for known and unknown chunks', async () => {
    await expect(prefetchRouteChunk('not-a-real-chunk')).resolves.toBeUndefined();
    await expect(prefetchRouteChunks([])).resolves.toEqual([]);
  });

  it('known chunk loaders reject safely without throwing to callers', async () => {
    // Dynamic imports of .vue may fail under Jest; prefetch must swallow errors.
    await expect(prefetchRouteChunk('gallery')).resolves.toBeUndefined();
    await expect(prefetchRouteChunk('product')).resolves.toBeUndefined();
    await expect(prefetchStorefrontRoutes()).resolves.toBeDefined();
  });
});
