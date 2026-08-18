function primaryProductImage(product) {
    if (!product || !Array.isArray(product.product_images)) {
        return null;
    }
    const imgs = product.product_images.filter((i) => i && i.image_url);
    if (!imgs.length) {
        return null;
    }
    const primary = imgs.find((i) => i.is_primary);
    return primary || imgs[0];
}

function primaryProductImageUrl(product) {
    const img = primaryProductImage(product);
    return img && img.image_url ? String(img.image_url) : null;
}

function displayProductName(product) {
    return product?.title || (product?.slug ? String(product.slug) : 'Product');
}

module.exports = {
    primaryProductImage,
    primaryProductImageUrl,
    displayProductName
};
