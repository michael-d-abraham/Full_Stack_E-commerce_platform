const { resolveHeroImageFileIds } = require('./homePageDefaults');

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeImageKitFileId(value) {
    if (value === undefined || value === null) {
        return null;
    }
    const id = String(value).trim();
    return id || null;
}

/**
 * @param {...(string|string[]|null|undefined)[]} values
 * @returns {Set<string>}
 */
function collectFileIdsFromValues(...values) {
    const ids = new Set();
    for (const value of values) {
        if (Array.isArray(value)) {
            for (const item of value) {
                const id = normalizeImageKitFileId(item);
                if (id) {
                    ids.add(id);
                }
            }
            continue;
        }
        const id = normalizeImageKitFileId(value);
        if (id) {
            ids.add(id);
        }
    }
    return ids;
}

/**
 * File IDs present before save but not after (valid IDs only).
 * @param {Set<string>|string[]} previousIds
 * @param {Set<string>|string[]} nextIds
 * @returns {string[]}
 */
function fileIdsRemoved(previousIds, nextIds) {
    const previous =
        previousIds instanceof Set ? previousIds : collectFileIdsFromValues(previousIds);
    const next = nextIds instanceof Set ? nextIds : collectFileIdsFromValues(nextIds);
    const removed = [];
    for (const id of previous) {
        if (!next.has(id)) {
            removed.push(id);
        }
    }
    return removed;
}

/**
 * @param {Array<{ image_provider_id?: string|null }>} images
 * @returns {Set<string>}
 */
function incomingProductImageProviderIds(images) {
    const ids = new Set();
    for (const img of images) {
        const id = normalizeImageKitFileId(img && img.image_provider_id);
        if (id) {
            ids.add(id);
        }
    }
    return ids;
}

/**
 * @param {Array<{ image_provider_id?: string|null }>} existingRows
 * @param {Set<string>} incomingIdSet
 * @returns {string[]}
 */
function removedProductImageProviderIds(existingRows, incomingIdSet) {
    const removed = [];
    for (const row of existingRows) {
        const id = normalizeImageKitFileId(row && row.image_provider_id);
        if (id && !incomingIdSet.has(id)) {
            removed.push(id);
        }
    }
    return removed;
}

/**
 * @param {object|null|undefined} homePage
 * @returns {Set<string>}
 */
function collectStoredHomePageFileIds(homePage) {
    const base = homePage && typeof homePage === 'object' ? homePage : {};
    return collectFileIdsFromValues(
        resolveHeroImageFileIds(base),
        base.about_image_file_id,
        base.about_me_left_image_file_id,
        base.about_me_right_image_file_id,
        base.hero_lines_image_file_id,
        base.hero_background_image_file_id,
        base.featured_background_image_file_id,
        base.about_background_image_file_id
    );
}

/**
 * @param {object} homePage
 * @returns {Set<string>}
 */
function collectParsedHomePageFileIds(homePage) {
    return collectFileIdsFromValues(
        homePage.hero_image_file_ids,
        homePage.about_image_file_id,
        homePage.about_me_left_image_file_id,
        homePage.about_me_right_image_file_id,
        homePage.hero_lines_image_file_id,
        homePage.hero_background_image_file_id,
        homePage.about_background_image_file_id
    );
}

module.exports = {
    normalizeImageKitFileId,
    collectFileIdsFromValues,
    fileIdsRemoved,
    incomingProductImageProviderIds,
    removedProductImageProviderIds,
    collectStoredHomePageFileIds,
    collectParsedHomePageFileIds
};
