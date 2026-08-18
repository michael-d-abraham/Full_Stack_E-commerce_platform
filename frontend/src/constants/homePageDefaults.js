import { mergeHomePageTextDefaults } from '@shared/homePageDefaults.js';

export function applyHomePageDefaults(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const text = mergeHomePageTextDefaults(data);
  return {
    ...text,
    featured_products: Array.isArray(data.featured_products)
      ? data.featured_products
      : text.featured_products
  };
}
