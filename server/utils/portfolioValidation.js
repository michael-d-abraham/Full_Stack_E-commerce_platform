const { isValidGalleryWorkLabel } = require('../../shared/galleryLabels');

function isNonEmptyString(value) {
    return value != null && String(value).trim() !== '';
}

function validateGalleryLabel(body, errors, { required = false } = {}) {
    if (body.label === undefined) {
        if (required) {
            errors.push('label is required');
        }
        return;
    }
    if (typeof body.label !== 'string') {
        errors.push('label must be a string');
        return;
    }
    const trimmed = String(body.label).trim();
    if (!trimmed) {
        errors.push('label is required');
        return;
    }
    if (!isValidGalleryWorkLabel(trimmed)) {
        errors.push('label must be one of the allowed gallery labels');
    }
}

function validatePortfolioImagesArray(images, errors, { isCreate = false } = {}) {
    if (!Array.isArray(images)) {
        errors.push('images must be an array');
        return;
    }
    if (isCreate && images.length === 0) {
        errors.push('At least one photo is required');
        return;
    }
    images.forEach((img, i) => {
        if (img == null || typeof img !== 'object') {
            errors.push(`images[${i}] must be an object`);
            return;
        }
        if (!isNonEmptyString(img.image_url)) {
            errors.push(`images[${i}].image_url is required`);
        }
        if (img.is_primary !== undefined && typeof img.is_primary !== 'boolean') {
            errors.push(`images[${i}].is_primary must be a boolean`);
        }
        if (
            img.image_provider_id !== undefined &&
            img.image_provider_id !== null &&
            typeof img.image_provider_id !== 'string'
        ) {
            errors.push(`images[${i}].image_provider_id must be a string or null`);
        }
    });
}

function validateCommonPortfolioFields(body, errors) {
    if (body.title !== undefined && typeof body.title !== 'string') {
        errors.push('title must be a string');
    }
    if (body.description !== undefined && typeof body.description !== 'string') {
        errors.push('description must be a string');
    }
    if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
        errors.push('is_active must be a boolean');
    }
    if (body.slug !== undefined && !isNonEmptyString(body.slug)) {
        errors.push('slug cannot be empty');
    }
}

function validatePortfolioCreateBody(body) {
    const errors = [];
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    validateCommonPortfolioFields(body, errors);
    validateGalleryLabel(body, errors, { required: true });
    if (body.images === undefined) {
        errors.push('At least one photo is required');
    } else {
        validatePortfolioImagesArray(body.images, errors, { isCreate: true });
    }
    return errors.length ? { errors } : null;
}

function validatePortfolioUpdateBody(body) {
    if (body == null || typeof body !== 'object') {
        return { errors: ['Request body must be a JSON object'] };
    }
    const errors = [];
    validateCommonPortfolioFields(body, errors);
    validateGalleryLabel(body, errors);
    if (body.images !== undefined) {
        validatePortfolioImagesArray(body.images, errors);
        if (Array.isArray(body.images) && body.images.length === 0) {
            errors.push('At least one photo is required');
        }
    }
    return errors.length ? { errors } : null;
}

module.exports = {
    validatePortfolioCreateBody,
    validatePortfolioUpdateBody
};
