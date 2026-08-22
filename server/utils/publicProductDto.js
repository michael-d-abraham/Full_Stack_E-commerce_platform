/**
 * Public storefront product DTOs — strip admin/Stripe internals and slim list payloads.
 */

function idString(value) {
    if (value == null) {
        return null;
    }
    return String(value);
}

function toPublicImage(image) {
    if (!image || !image.image_url) {
        return null;
    }
    return {
        _id: idString(image._id),
        image_url: String(image.image_url),
        alt_text: image.alt_text != null ? String(image.alt_text) : null,
        sort_order: Number(image.sort_order) || 0,
        is_primary: Boolean(image.is_primary)
    };
}

function sortImages(images) {
    return [...images].sort((a, b) => {
        const orderDiff = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
        if (orderDiff !== 0) {
            return orderDiff;
        }
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aCreated - bCreated;
    });
}

function pickPrimaryImage(images) {
    const list = Array.isArray(images) ? images.filter((img) => img && img.image_url) : [];
    if (!list.length) {
        return null;
    }
    const sorted = sortImages(list);
    const primary = sorted.find((img) => img.is_primary);
    return toPublicImage(primary || sorted[0]);
}

function basePublicFields(product) {
    const id = idString(product._id || product.id);
    return {
        _id: id,
        id,
        title: product.title,
        label: product.label != null ? String(product.label) : '',
        slug: product.slug,
        price_cents: product.price_cents,
        currency: product.currency || 'usd',
        quantity_available: product.quantity_available,
        size_label: product.size_label != null ? product.size_label : null,
        is_active: Boolean(product.is_active),
        created_at: product.created_at || null,
        updated_at: product.updated_at || null
    };
}

/**
 * Lightweight gallery/card row — primary image only.
 * @param {object} product Lean or hydrated Product with product_images
 */
function toPublicProductListItem(product) {
    if (!product) {
        return null;
    }
    const primary = pickPrimaryImage(product.product_images);
    return {
        ...basePublicFields(product),
        product_images: primary ? [primary] : []
    };
}

/**
 * Full public product detail by slug.
 * @param {object} product Lean or hydrated Product with product_images
 */
function toPublicProductDetail(product) {
    if (!product) {
        return null;
    }
    const images = Array.isArray(product.product_images)
        ? sortImages(product.product_images)
            .map(toPublicImage)
            .filter(Boolean)
        : [];

    return {
        ...basePublicFields(product),
        description: product.description != null ? String(product.description) : '',
        format: product.format != null ? product.format : null,
        year_created: product.year_created != null ? product.year_created : null,
        product_images: images
    };
}

module.exports = {
    toPublicProductListItem,
    toPublicProductDetail,
    toPublicImage,
    pickPrimaryImage
};
