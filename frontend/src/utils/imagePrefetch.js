import { buildImageKitSrc } from './imageKitUrl.js';

const prefetchedUrls = new Set();
const preloadLinks = new Set();

/**
 * Prefetch an image URL (optionally ImageKit-resized) into the browser cache.
 * @param {string|null|undefined} url
 * @param {{ width?: number, quality?: number }} [options]
 * @returns {Promise<void>}
 */
export function prefetchImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') {
    return Promise.resolve();
  }
  const src = options.width ? buildImageKitSrc(url, options) : url;
  if (!src || prefetchedUrls.has(src)) {
    return Promise.resolve();
  }
  prefetchedUrls.add(src);

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

/**
 * Prefetch multiple product image URLs at a target display width.
 * @param {object|null|undefined} product
 * @param {{ width?: number }} [options]
 */
export function prefetchProductImageUrls(product, options = {}) {
  const images = product?.product_images;
  if (!Array.isArray(images)) {
    return;
  }
  const width = options.width || 960;
  for (const image of images) {
    const url = image?.image_url;
    if (url) {
      prefetchImageUrl(url, { width, quality: 80 });
    }
  }
}

/**
 * Add a <link rel="preload"> for an LCP candidate. Deduped by href.
 * @param {string|null|undefined} url
 * @param {{ width?: number, as?: string }} [options]
 */
export function preloadImageLink(url, options = {}) {
  if (typeof document === 'undefined' || !url) {
    return;
  }
  const href = options.width ? buildImageKitSrc(url, { width: options.width, quality: 80 }) : url;
  if (!href || preloadLinks.has(href)) {
    return;
  }
  preloadLinks.add(href);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = options.as || 'image';
  link.href = href;
  document.head.appendChild(link);
}

export function __resetImagePrefetchForTests() {
  prefetchedUrls.clear();
  preloadLinks.clear();
}
