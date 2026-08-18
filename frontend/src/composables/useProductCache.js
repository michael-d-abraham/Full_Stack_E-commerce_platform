import { getProductBySlug, getProducts } from '../services/api.js';

const productCache = new Map();
const inflightRequests = new Map();
const prefetchedImageUrls = new Set();
/** Slugs whose cache entry came from GET /api/product/:slug (full detail, all images). */
const completeDetailSlugs = new Set();

/** In-memory products list for cart/home/checkout (compat with ensureProductsList callers). */
let productsListCache = null;
let productsListInflight = null;

function productImageIds(product) {
  const imgs = product?.product_images;
  if (!Array.isArray(imgs)) {
    return '';
  }
  return imgs.map((image) => image?._id || image?.image_url).filter(Boolean).join(',');
}

export function hasProductChanged(current, fresh) {
  if (!fresh) {
    return false;
  }
  if (!current) {
    return true;
  }

  // Image set can change independently of updated_at when a slim list stub
  // (primary-only) is replaced by full detail — that must count as a change
  // or product view never enables multi-image swipe.
  if (productImageIds(current) !== productImageIds(fresh)) {
    return true;
  }

  if (current.updated_at && fresh.updated_at) {
    if (current.updated_at !== fresh.updated_at) {
      return true;
    }
  }

  return (
    current.price_cents !== fresh.price_cents
    || current.quantity_available !== fresh.quantity_available
    || (current.description || '') !== (fresh.description || '')
  );
}

export function isProductDetailComplete(slug) {
  if (!slug) {
    return false;
  }
  return completeDetailSlugs.has(slug);
}

export function getCachedProduct(slug) {
  if (!slug) {
    return null;
  }
  return productCache.get(slug) ?? null;
}

/**
 * @param {string} slug
 * @param {object} product
 * @param {{ complete?: boolean, prefetchImages?: boolean }} [options]
 *        complete defaults to true (detail writes). Pass false for list stubs.
 */
export function setCachedProduct(slug, product, options = {}) {
  if (!slug || !product) {
    return;
  }
  productCache.set(slug, product);
  if (options.complete === false) {
    completeDetailSlugs.delete(slug);
  } else {
    completeDetailSlugs.add(slug);
  }
  if (options.prefetchImages !== false) {
    prefetchProductImages(product);
  }
}

function storeCompleteProduct(slug, product) {
  setCachedProduct(slug, product, { complete: true });
  return product;
}

/**
 * Seed per-slug cache from lightweight list rows (partial — detail fetch still required).
 * @param {object[]} products
 * @param {{ prefetchImages?: boolean, updateListCache?: boolean }} [options]
 */
export function seedProductCache(products = [], options = {}) {
  const prefetchImages = options.prefetchImages !== false;
  const updateListCache = options.updateListCache !== false;

  for (const product of products) {
    if (!product?.slug) {
      continue;
    }
    // Never overwrite a complete detail entry with a slim list stub.
    if (completeDetailSlugs.has(product.slug)) {
      if (prefetchImages) {
        prefetchProductImages(product);
      }
      continue;
    }
    productCache.set(product.slug, product);
    completeDetailSlugs.delete(product.slug);
    if (prefetchImages) {
      prefetchProductImages(product);
    }
  }

  if (updateListCache && Array.isArray(products) && products.length) {
    productsListCache = products;
  }
}

export function getCachedProductsList() {
  return Array.isArray(productsListCache) ? productsListCache : null;
}

/**
 * Stale-while-revalidate products list used by cart, home, and checkout.
 * @param {{ onUpdate?: (list: object[]) => void, force?: boolean }} [options]
 */
export function ensureProductsList(options = {}) {
  const { onUpdate, force = false } = options;

  if (!force && Array.isArray(productsListCache) && productsListCache.length) {
    if (productsListInflight == null) {
      productsListInflight = getProducts()
        .then((list) => {
          const next = Array.isArray(list) ? list : [];
          productsListCache = next;
          seedProductCache(next, { prefetchImages: false, updateListCache: false });
          if (typeof onUpdate === 'function') {
            onUpdate(next);
          }
          return next;
        })
        .finally(() => {
          productsListInflight = null;
        });
    }
    return Promise.resolve(productsListCache);
  }

  if (productsListInflight) {
    return productsListInflight;
  }

  productsListInflight = getProducts()
    .then((list) => {
      const next = Array.isArray(list) ? list : [];
      productsListCache = next;
      seedProductCache(next, { prefetchImages: false, updateListCache: false });
      if (typeof onUpdate === 'function') {
        onUpdate(next);
      }
      return next;
    })
    .finally(() => {
      productsListInflight = null;
    });

  return productsListInflight;
}

export function prefetchProductImages(product) {
  const images = product?.product_images;
  if (!Array.isArray(images)) {
    return;
  }

  for (const image of images) {
    const url = image?.image_url;
    if (!url || prefetchedImageUrls.has(url)) {
      continue;
    }
    prefetchedImageUrls.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}

export function prefetchProduct(slug) {
  if (!slug) {
    return Promise.resolve(null);
  }

  const cached = productCache.get(slug);
  if (cached && completeDetailSlugs.has(slug)) {
    prefetchProductImages(cached);
    return Promise.resolve(cached);
  }

  if (inflightRequests.has(slug)) {
    return inflightRequests.get(slug);
  }

  const request = getProductBySlug(slug)
    .then((product) => storeCompleteProduct(slug, product))
    .finally(() => {
      inflightRequests.delete(slug);
    });

  inflightRequests.set(slug, request);
  return request;
}

export async function fetchProduct(slug) {
  return prefetchProduct(slug);
}

export async function refreshProductInBackground(slug, onUpdate) {
  if (!slug) {
    return null;
  }

  try {
    // Prefer any in-flight prefetch so Gallery → overlay does not double-fetch.
    const fresh = inflightRequests.has(slug)
      ? await inflightRequests.get(slug)
      : await getProductBySlug(slug);
    const cached = productCache.get(slug);
    if (fresh) {
      storeCompleteProduct(slug, fresh);
    }
    if (typeof onUpdate === 'function' && hasProductChanged(cached, fresh)) {
      onUpdate(fresh);
    }
    return fresh;
  } catch {
    return cachedProductFallback(slug);
  }
}

function cachedProductFallback(slug) {
  return productCache.get(slug) ?? null;
}

export function __resetProductCacheForTests() {
  productCache.clear();
  inflightRequests.clear();
  prefetchedImageUrls.clear();
  completeDetailSlugs.clear();
  productsListCache = null;
  productsListInflight = null;
}
