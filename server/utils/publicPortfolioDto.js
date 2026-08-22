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

function basePublicFields(work) {
    const id = idString(work._id || work.id);
    return {
        _id: id,
        id,
        title: work.title != null ? String(work.title) : '',
        label: work.label != null ? String(work.label) : '',
        slug: work.slug,
        is_active: Boolean(work.is_active),
        created_at: work.created_at || null,
        updated_at: work.updated_at || null
    };
}

function toPublicPortfolioListItem(work) {
    if (!work) {
        return null;
    }
    const primary = pickPrimaryImage(work.portfolio_images);
    return {
        ...basePublicFields(work),
        portfolio_images: primary ? [primary] : []
    };
}

function toPublicPortfolioDetail(work) {
    if (!work) {
        return null;
    }
    const images = Array.isArray(work.portfolio_images)
        ? sortImages(work.portfolio_images)
            .map(toPublicImage)
            .filter(Boolean)
        : [];

    return {
        ...basePublicFields(work),
        description: work.description != null ? String(work.description) : '',
        portfolio_images: images
    };
}

module.exports = {
    toPublicPortfolioListItem,
    toPublicPortfolioDetail,
    pickPrimaryImage
};
