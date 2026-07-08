import { getProductBySlug } from '../services/api.js';

const productCache = new Map();
const inflightRequests = new Map();
const prefetchedImageUrls = new Set();

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
  if (current.updated_at && fresh.updated_at) {
    return current.updated_at !== fresh.updated_at;
  }
  return (
    current.price_cents !== fresh.price_cents
    || current.quantity_available !== fresh.quantity_available
    || (current.description || '') !== (fresh.description || '')
    || productImageIds(current) !== productImageIds(fresh)
  );
}

export function getCachedProduct(slug) {
  if (!slug) {
    return null;
  }
  return productCache.get(slug) ?? null;
}

export function setCachedProduct(slug, product) {
  if (!slug || !product) {
    return;
  }
  productCache.set(slug, product);
  prefetchProductImages(product);
}

export function seedProductCache(products = []) {
  for (const product of products) {
    if (product?.slug) {
      productCache.set(product.slug, product);
      prefetchProductImages(product);
    }
  }
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
  if (cached) {
    prefetchProductImages(cached);
    return Promise.resolve(cached);
  }

  if (inflightRequests.has(slug)) {
    return inflightRequests.get(slug);
  }

  const request = getProductBySlug(slug)
    .then((product) => {
      productCache.set(slug, product);
      prefetchProductImages(product);
      return product;
    })
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
    const fresh = await getProductBySlug(slug);
    const cached = productCache.get(slug);
    productCache.set(slug, fresh);
    prefetchProductImages(fresh);
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
}
