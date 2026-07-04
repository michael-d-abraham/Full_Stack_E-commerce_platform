const DEFAULT_SITE_NAME = 'PERM';
const MAX_SITE_NAME_LENGTH = 80;
const BRAND_DISPLAY_TEXT = 'text';
const BRAND_DISPLAY_IMAGE = 'image';
const BRAND_DISPLAY_MODES = [BRAND_DISPLAY_TEXT, BRAND_DISPLAY_IMAGE];

function normalizeOptionalText(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
}

function resolveSiteName(value) {
    const normalized = normalizeOptionalText(value);
    return normalized || DEFAULT_SITE_NAME;
}

function normalizeBrandDisplayMode(value) {
    const normalized = normalizeOptionalText(value).toLowerCase();
    if (normalized === BRAND_DISPLAY_IMAGE) {
        return BRAND_DISPLAY_IMAGE;
    }
    return BRAND_DISPLAY_TEXT;
}

function resolveBrandDisplayMode(mode, logoUrl) {
    if (normalizeBrandDisplayMode(mode) === BRAND_DISPLAY_IMAGE && normalizeOptionalText(logoUrl)) {
        return BRAND_DISPLAY_IMAGE;
    }
    return BRAND_DISPLAY_TEXT;
}

function normalizeSiteNameInput(value) {
    if (value === undefined || value === null) {
        return { site_name: '' };
    }

    const site_name = String(value).trim();
    if (site_name.length > MAX_SITE_NAME_LENGTH) {
        return {
            errors: [`site_name must be ${MAX_SITE_NAME_LENGTH} characters or fewer`]
        };
    }

    return { site_name };
}

function normalizeSiteLogoUrlInput(value) {
    if (value === undefined || value === null) {
        return { site_logo_url: '' };
    }

    return { site_logo_url: String(value).trim() };
}

module.exports = {
    DEFAULT_SITE_NAME,
    MAX_SITE_NAME_LENGTH,
    BRAND_DISPLAY_TEXT,
    BRAND_DISPLAY_IMAGE,
    BRAND_DISPLAY_MODES,
    normalizeOptionalText,
    resolveSiteName,
    normalizeBrandDisplayMode,
    resolveBrandDisplayMode,
    normalizeSiteNameInput,
    normalizeSiteLogoUrlInput
};
