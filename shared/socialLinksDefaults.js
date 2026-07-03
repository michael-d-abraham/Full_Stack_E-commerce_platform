const PLATFORMS = ['youtube', 'instagram', 'tiktok', 'facebook'];

const DEFAULT_SOCIAL_LINKS = {
    youtube: {
        url: 'https://www.youtube.com/',
        enabled: true,
        label: 'YouTube'
    },
    instagram: {
        url: 'https://www.instagram.com/',
        enabled: true,
        label: 'Instagram'
    },
    tiktok: {
        url: 'https://www.tiktok.com/',
        enabled: true,
        label: 'TikTok'
    },
    facebook: {
        url: 'https://www.facebook.com/',
        enabled: true,
        label: 'Facebook'
    }
};

const PLATFORM_LABELS = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    facebook: 'Facebook'
};

function isValidHttpUrl(value) {
    if (!value || typeof value !== 'string') {
        return false;
    }
    try {
        const parsed = new URL(value.trim());
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

module.exports = {
    PLATFORMS,
    DEFAULT_SOCIAL_LINKS,
    PLATFORM_LABELS,
    isValidHttpUrl
};
