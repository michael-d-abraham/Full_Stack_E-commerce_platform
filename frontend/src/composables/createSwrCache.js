/**
 * Stale-while-revalidate cache with optional localStorage persistence and
 * in-flight request deduplication.
 *
 * @param {object} [options]
 * @param {string|null} [options.storageKey]
 * @param {Storage|null} [options.storage]
 * @param {number|null} [options.ttlMs]
 * @param {(a: unknown, b: unknown) => boolean} [options.hasChanged]
 * @param {(value: unknown) => string} [options.serialize]
 * @param {(raw: string) => unknown} [options.deserialize]
 */
export function createSwrCache(options = {}) {
  const {
    storageKey = null,
    storage = typeof localStorage !== 'undefined' ? localStorage : null,
    ttlMs = null,
    hasChanged = defaultHasChanged,
    serialize = JSON.stringify,
    deserialize = JSON.parse
  } = options;

  let memory = null;
  let memoryAt = 0;
  let inflight = null;

  function readStorageEntry() {
    if (!storage || !storageKey) {
      return null;
    }
    try {
      const raw = storage.getItem(storageKey);
      if (!raw) {
        return null;
      }
      const parsed = deserialize(raw);
      if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
        return null;
      }
      return {
        data: parsed.data,
        at: typeof parsed.at === 'number' ? parsed.at : 0
      };
    } catch {
      return null;
    }
  }

  function writeStorage(data) {
    if (!storage || !storageKey) {
      return;
    }
    try {
      storage.setItem(
        storageKey,
        serialize({
          data,
          at: memoryAt
        })
      );
    } catch {
      /* quota / private mode */
    }
  }

  function clearStorage() {
    if (!storage || !storageKey) {
      return;
    }
    try {
      storage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  function getCached() {
    if (memory != null) {
      return memory;
    }
    const entry = readStorageEntry();
    if (entry && entry.data != null) {
      memory = entry.data;
      memoryAt = entry.at;
    }
    return memory;
  }

  function setCached(data) {
    memory = data;
    memoryAt = Date.now();
    writeStorage(data);
  }

  function hasCache() {
    return getCached() != null;
  }

  function isFresh() {
    if (!hasCache()) {
      return false;
    }
    if (ttlMs == null) {
      return true;
    }
    return Date.now() - memoryAt <= ttlMs;
  }

  function refresh(fetcher, { onUpdate } = {}) {
    if (typeof fetcher !== 'function') {
      return Promise.reject(new Error('refresh requires a fetcher function'));
    }
    if (inflight) {
      return inflight;
    }

    const previous = getCached();
    inflight = Promise.resolve()
      .then(() => fetcher())
      .then((data) => {
        const changed = hasChanged(previous, data);
        setCached(data);
        if (changed && typeof onUpdate === 'function') {
          onUpdate(data, previous);
        }
        return data;
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  }

  /**
   * Return cached data immediately when present (and kick a background refresh),
   * otherwise await the first fetch.
   */
  function ensure(fetcher, { onUpdate, force = false } = {}) {
    const cached = getCached();

    if (!force && cached != null) {
      // Stale-while-revalidate: serve cache, refresh in background.
      refresh(fetcher, { onUpdate }).catch(() => {});
      return Promise.resolve(cached);
    }

    return refresh(fetcher, { onUpdate });
  }

  function invalidate() {
    memory = null;
    memoryAt = 0;
    inflight = null;
    clearStorage();
  }

  // Synchronous hydrate from storage on create.
  getCached();

  return {
    getCached,
    setCached,
    hasCache,
    isFresh,
    ensure,
    refresh,
    invalidate,
    get inflight() {
      return inflight;
    }
  };
}

function defaultHasChanged(a, b) {
  try {
    return JSON.stringify(a) !== JSON.stringify(b);
  } catch {
    return a !== b;
  }
}

export function __createSwrCacheForTests(options) {
  return createSwrCache(options);
}
