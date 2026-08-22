/**
 * Pair artwork images with client reviews into single marquee cards.
 */
export function pairMarqueeItems(images = [], quotes = []) {
  const artwork = Array.isArray(images) ? images : [];
  const reviews = Array.isArray(quotes) ? quotes : [];

  if (!artwork.length || !reviews.length) {
    return [];
  }

  const length = Math.max(artwork.length, reviews.length);
  const result = [];

  for (let index = 0; index < length; index += 1) {
    const image = artwork[index % artwork.length];
    const quote = reviews[index % reviews.length];

    result.push({
      id: `${image.id}--${quote.id}`,
      variant: 'paired',
      src: image.src,
      alt: image.alt || '',
      quote: quote.quote,
      name: quote.name,
      role: quote.role
    });
  }

  return result;
}
