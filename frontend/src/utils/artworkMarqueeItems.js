/**
 * Build a seamless artwork marquee sequence from public portfolio works.
 * Falls back to placeholders when the gallery has no photos yet.
 */

export function artworkFromWorks(list) {
  const seen = new Set();
  const result = [];

  for (const work of Array.isArray(list) ? list : []) {
    const images = Array.isArray(work?.portfolio_images) ? work.portfolio_images : [];
    const primary = images.find((image) => image?.is_primary && image?.image_url) || images.find((image) => image?.image_url);
    const src = primary?.image_url ? String(primary.image_url) : '';
    if (!src) {
      continue;
    }
    const id = String(work?._id || work?.id || src);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    const alt = String(primary?.alt_text || work?.label || work?.title || work?.slug || '').trim();
    result.push({ id, src, alt });
  }

  return result;
}

export function padForLoop(source, minCount = 8) {
  if (!Array.isArray(source) || !source.length) {
    return [];
  }
  if (source.length >= minCount) {
    return source;
  }
  const padded = [];
  while (padded.length < minCount) {
    padded.push(...source);
  }
  return padded.slice(0, minCount);
}

export function artworkMarqueeDuration(itemCount, { minSeconds = 45, secondsPerItem = 5 } = {}) {
  const count = Number(itemCount) || 0;
  return `${Math.max(minSeconds, count * secondsPerItem)}s`;
}

export function resolveArtworkMarqueeItems(works, placeholders = []) {
  const fromGallery = artworkFromWorks(works);
  const fallback = Array.isArray(placeholders) ? placeholders : [];
  return padForLoop(fromGallery.length ? fromGallery : fallback);
}
