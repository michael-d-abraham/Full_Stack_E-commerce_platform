const { PortfolioImage } = require('../db');
const { deleteImageKitFilesBestEffort } = require('../services/imageKitStorageService');
const {
    incomingProductImageProviderIds,
    removedProductImageProviderIds,
    normalizeImageKitFileId
} = require('./imageKitFileIds');

function normalizeImages(images) {
    let primarySet = false;
    return images.map((raw) => {
        const img = { ...raw };
        if (img.is_primary === true && !primarySet) {
            primarySet = true;
        } else {
            img.is_primary = false;
        }
        return img;
    });
}

async function createImagesForPortfolioWork(portfolioWorkId, images, session = null) {
    if (!images.length) {
        return [];
    }
    let lastQ = PortfolioImage.find({ portfolio_work_id: portfolioWorkId, deleted_at: null })
        .sort({ sort_order: -1 })
        .select('sort_order')
        .lean();
    if (session) lastQ = lastQ.session(session);
    const last = await lastQ;
    let nextSort = last && typeof last.sort_order === 'number' ? last.sort_order + 1 : 0;

    const created = [];
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const sortOrder = img.sort_order !== undefined ? img.sort_order : nextSort;
        nextSort = sortOrder + 1;

        if (img.is_primary === true) {
            let up = PortfolioImage.updateMany(
                { portfolio_work_id: portfolioWorkId, deleted_at: null },
                { $set: { is_primary: false } }
            );
            if (session) up = up.session(session);
            await up;
        }

        const doc = {
            portfolio_work_id: portfolioWorkId,
            image_url: String(img.image_url).trim(),
            image_provider_id: normalizeImageKitFileId(img.image_provider_id),
            alt_text: img.alt_text == null ? null : String(img.alt_text).trim(),
            sort_order: sortOrder,
            is_primary: img.is_primary === true,
            deleted_at: null
        };
        if (img.is_active !== undefined) {
            doc.is_active = img.is_active;
        }
        const opts = session ? { session } : {};
        const [row] = await PortfolioImage.create([doc], opts);
        created.push(row);
    }
    return created;
}

async function syncImagesForPortfolioWork(portfolioWorkId, rawImages, session = null) {
    const images = Array.isArray(rawImages) ? normalizeImages(rawImages) : [];

    let existingQuery = PortfolioImage.find({ portfolio_work_id: portfolioWorkId, deleted_at: null })
        .select('image_provider_id')
        .lean();
    if (session) existingQuery = existingQuery.session(session);
    const existing = await existingQuery;

    const incomingIds = incomingProductImageProviderIds(images);
    const removedFileIds = removedProductImageProviderIds(existing, incomingIds);

    let softDelete = PortfolioImage.updateMany(
        { portfolio_work_id: portfolioWorkId, deleted_at: null },
        { $set: { deleted_at: new Date() } }
    );
    if (session) softDelete = softDelete.session(session);
    await softDelete;

    if (images.length) {
        await createImagesForPortfolioWork(portfolioWorkId, images, session);
    }

    if (!session && removedFileIds.length) {
        await deleteImageKitFilesBestEffort(removedFileIds);
    }

    return images;
}

async function softDeletePortfolioImagesWithCleanup(portfolioWorkId, deletedAt = new Date()) {
    const activeImages = await PortfolioImage.find({
        portfolio_work_id: portfolioWorkId,
        deleted_at: null
    })
        .select('image_provider_id')
        .lean();

    const fileIds = removedProductImageProviderIds(activeImages, new Set());

    await PortfolioImage.updateMany(
        { portfolio_work_id: portfolioWorkId, deleted_at: null },
        { $set: { deleted_at: deletedAt } }
    );

    if (fileIds.length) {
        await deleteImageKitFilesBestEffort(fileIds);
    }
}

module.exports = {
    normalizeImages,
    createImagesForPortfolioWork,
    syncImagesForPortfolioWork,
    softDeletePortfolioImagesWithCleanup
};
