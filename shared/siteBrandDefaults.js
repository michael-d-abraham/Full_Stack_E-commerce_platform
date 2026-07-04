const DEFAULT_SITE_NAME = 'PERM';
const MAX_SITE_NAME_LENGTH = 80;

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

module.exports = {
    DEFAULT_SITE_NAME,
    MAX_SITE_NAME_LENGTH,
    normalizeOptionalText,
    resolveSiteName,
    normalizeSiteNameInput
};
