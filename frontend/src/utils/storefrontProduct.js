/**
 * Storefront display helpers — Product is the source of truth for catalog display.
 */

import {
    displayProductName,
    primaryProductImage,
    primaryProductImageUrl
} from '@shared/productDisplay.js';

export { displayProductName, primaryProductImage, primaryProductImageUrl };

export function productTitle(product) {
    const label = product?.label != null ? String(product.label).trim() : '';
    if (label) {
        return label;
    }
    if (product?.title) {
        return product.title;
    }
    return product?.slug || 'Product';
}

export function productFormat(product) {
    return product?.format ? String(product.format).trim() : '';
}

export function productMetaLines(product) {
    if (!product) {
        return [];
    }

    const lines = [];
    if (product.year_created != null) {
        lines.push(`Year: ${product.year_created}`);
    }
    const format = productFormat(product);
    if (format) {
        lines.push(`Format: ${format}`);
    }
    if (product.size_label) {
        lines.push(`Size: ${product.size_label}`);
    }
    return lines;
}

export function hasProductMeta(product) {
    return productMetaLines(product).length > 0;
}
