const DEFAULT_SITE_NAME = 'PERM';
const MAX_SITE_NAME_LENGTH = 80;
const SITE_NAME_MODES = ['text', 'image'];

function normalizeOptionalText(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
}

function normalizeSiteNameMode(value) {
    const mode = normalizeOptionalText(value).toLowerCase();
    return mode === 'image' ? 'image' : 'text';
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

function resolveSiteBranding(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};
    const site_name = resolveSiteName(base.site_name);
    const site_name_logo_url = normalizeOptionalText(base.site_name_logo_url);
    const requestedMode = normalizeSiteNameMode(base.site_name_mode);
    const site_name_mode =
        requestedMode === 'image' && site_name_logo_url ? 'image' : 'text';

    return {
        site_name,
        site_name_mode,
        site_name_logo_url: site_name_mode === 'image' ? site_name_logo_url : ''
    };
}

function toAdminSiteBranding(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};
    return {
        site_name: normalizeOptionalText(base.site_name),
        site_name_mode: normalizeSiteNameMode(base.site_name_mode),
        site_name_logo_url: normalizeOptionalText(base.site_name_logo_url),
        site_name_logo_file_id: normalizeOptionalText(base.site_name_logo_file_id)
    };
}

function normalizeSiteBrandingInput(body, { isValidHttpUrl } = {}) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { errors: ['Request body is required'] };
    }

    const nameParsed = normalizeSiteNameInput(body.site_name);
    if (nameParsed.errors) {
        errors.push(...nameParsed.errors);
    }

    const site_name_mode = normalizeSiteNameMode(body.site_name_mode);
    let site_name_logo_url = normalizeOptionalText(body.site_name_logo_url);

    if (site_name_logo_url) {
        if (typeof isValidHttpUrl === 'function' && !isValidHttpUrl(site_name_logo_url)) {
            errors.push('site_name_logo_url must be a valid http or https URL');
        }
    } else if (site_name_mode === 'image') {
        errors.push('site_name_logo_url is required when site_name_mode is image');
    }

    if (errors.length) {
        return { errors };
    }

    return {
        site_name: nameParsed.site_name,
        site_name_mode,
        site_name_logo_url,
        site_name_logo_file_id: normalizeOptionalText(body.site_name_logo_file_id)
    };
}

module.exports = {
    DEFAULT_SITE_NAME,
    MAX_SITE_NAME_LENGTH,
    SITE_NAME_MODES,
    normalizeOptionalText,
    normalizeSiteNameMode,
    resolveSiteName,
    normalizeSiteNameInput,
    resolveSiteBranding,
    toAdminSiteBranding,
    normalizeSiteBrandingInput
};
