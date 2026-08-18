/**
 * @jest-environment jsdom
 */

const { createSwrCache } = require('../frontend/src/composables/createSwrCache.js');

describe('createSwrCache', () => {
  let storage;

  beforeEach(() => {
    storage = (() => {
      const map = new Map();
      return {
        getItem: (key) => (map.has(key) ? map.get(key) : null),
        setItem: (key, value) => {
          map.set(key, String(value));
        },
        removeItem: (key) => {
          map.delete(key);
        }
      };
    })();
  });

  it('hydrates synchronously from storage', () => {
    storage.setItem(
      'k',
      JSON.stringify({ data: { hello: 'world' }, at: Date.now() })
    );
    const cache = createSwrCache({ storageKey: 'k', storage });
    expect(cache.getCached()).toEqual({ hello: 'world' });
    expect(cache.hasCache()).toBe(true);
  });

  it('deduplicates in-flight refresh', async () => {
    const cache = createSwrCache({ storageKey: 'k', storage });
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetcher = jest.fn(() => fetchPromise);

    const first = cache.refresh(fetcher);
    const second = cache.refresh(fetcher);
    expect(first).toBe(second);
    resolveFetch({ ok: true });
    await expect(first).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(cache.getCached()).toEqual({ ok: true });
  });

  it('ensure returns cache immediately and refreshes in background', async () => {
    const cache = createSwrCache({ storageKey: 'k', storage });
    cache.setCached({ v: 1 });

    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const onUpdate = jest.fn();

    const ensurePromise = cache.ensure(() => fetchPromise, { onUpdate });
    const background = cache.inflight;
    const result = await ensurePromise;
    expect(result).toEqual({ v: 1 });
    expect(background).toBeTruthy();

    resolveFetch({ v: 2 });
    await background;
    expect(cache.getCached()).toEqual({ v: 2 });
    expect(onUpdate).toHaveBeenCalledWith({ v: 2 }, { v: 1 });
  });

  it('ensure returns stale data before the network resolves', async () => {
    const cache = createSwrCache({ storageKey: 'stale', storage });
    cache.setCached({ version: 'stale' });

    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetcher = jest.fn(() => fetchPromise);

    const t0 = Date.now();
    const result = await cache.ensure(fetcher);
    const elapsed = Date.now() - t0;

    expect(result).toEqual({ version: 'stale' });
    expect(elapsed).toBeLessThan(50);
    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveFetch({ version: 'fresh' });
    await cache.inflight;
    expect(cache.getCached()).toEqual({ version: 'fresh' });
  });

  it('invalidate clears memory and storage', () => {
    const cache = createSwrCache({ storageKey: 'k', storage });
    cache.setCached({ a: 1 });
    cache.invalidate();
    expect(cache.getCached()).toBeNull();
    expect(storage.getItem('k')).toBeNull();
  });
});
