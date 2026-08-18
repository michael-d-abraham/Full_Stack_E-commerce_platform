const IMAGEKIT_HOST_RE = /\.imagekit\.io$/i;

/**
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isImageKitUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return IMAGEKIT_HOST_RE.test(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * ImageKit path shape: /{id}/[tr:.../]rest...
 * @param {string} pathname
 * @returns {{ id: string, rest: string }}
 */
function parseImageKitPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) {
    return { id: '', rest: '' };
  }
  const id = parts[0];
  let idx = 1;
  if (parts[1] && parts[1].startsWith('tr:')) {
    idx = 2;
  }
  return {
    id,
    rest: parts.slice(idx).join('/')
  };
}

/**
 * Build an ImageKit URL with width/quality/format transforms.
 * Non-ImageKit URLs are returned unchanged.
 *
 * Artwork must never be cropped at the CDN: only width (and optional height with
 * `c-at_max` contain) is applied. Do not use ImageKit crop/extract modes here.
 *
 * @param {string|null|undefined} url
 * @param {{ width?: number, height?: number, quality?: number, format?: string }} [options]
 * @returns {string}
 */
export function buildImageKitSrc(url, options = {}) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  if (!isImageKitUrl(url)) {
    return url;
  }

  const { width, height, quality = 80, format = 'auto' } = options;

  try {
    const parsed = new URL(url);
    const { id, rest } = parseImageKitPath(parsed.pathname);
    if (!id) {
      return url;
    }
    const transforms = [];
    if (width) transforms.push(`w-${Math.round(width)}`);
    if (height) {
      transforms.push(`h-${Math.round(height)}`);
      // When both dimensions are set, force contain-style fit (no crop).
      if (width) {
        transforms.push('c-at_max');
      }
    }
    if (quality) transforms.push(`q-${Math.round(quality)}`);
    if (format) transforms.push(`f-${format}`);
    const tr = transforms.length ? `tr:${transforms.join(',')}` : null;
    parsed.pathname = tr
      ? `/${id}/${tr}/${rest}`
      : `/${id}/${rest}`;
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * @param {string|null|undefined} url
 * @param {number[]} [widths]
 * @param {{ quality?: number, format?: string }} [options]
 * @returns {string}
 */
export function buildSrcSet(url, widths = [320, 640, 960, 1280], options = {}) {
  if (!url || !isImageKitUrl(url)) {
    return '';
  }
  return widths
    .map((w) => `${buildImageKitSrc(url, { ...options, width: w })} ${w}w`)
    .join(', ');
}
