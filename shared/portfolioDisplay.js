function primaryPortfolioImage(work) {
    if (!work || !Array.isArray(work.portfolio_images)) {
        return null;
    }
    const imgs = work.portfolio_images.filter((i) => i && i.image_url);
    if (!imgs.length) {
        return null;
    }
    const primary = imgs.find((i) => i.is_primary);
    return primary || imgs[0];
}

function primaryPortfolioImageUrl(work) {
    const img = primaryPortfolioImage(work);
    return img && img.image_url ? String(img.image_url) : null;
}

function portfolioTitle(work) {
    const label = work?.label != null ? String(work.label).trim() : '';
    if (label) {
        return label;
    }
    const title = work?.title != null ? String(work.title).trim() : '';
    if (title) {
        return title;
    }
    return work?.slug || 'Work';
}

module.exports = {
    primaryPortfolioImage,
    primaryPortfolioImageUrl,
    portfolioTitle
};
