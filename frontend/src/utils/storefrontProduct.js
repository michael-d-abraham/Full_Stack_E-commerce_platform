/**
 * Storefront display helpers — Wanna Do's show title, description, price, and one photo.
 */

import {
    displayProductName,
    primaryProductImage,
    primaryProductImageUrl
} from '@shared/productDisplay.js';

export { displayProductName, primaryProductImage, primaryProductImageUrl };

export function productTitle(product) {
    if (product?.title) {
        return product.title;
    }
    return product?.slug || 'Product';
}

export function productMetaLines() {
    return [];
}

export function hasProductMeta() {
    return false;
}
