const path = require('path');

const ALLOWED_VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const MIME_TO_EXT = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov'
};

function normalizeClaimedMime(mimeType) {
    return String(mimeType || '').toLowerCase();
}

/**
 * Detect common video containers from magic bytes.
 * @param {Buffer} buffer
 * @returns {string|null}
 */
function detectVideoMime(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
        return null;
    }

    if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
        return 'video/webm';
    }

    if (buffer.length < 12) {
        return null;
    }

    const signature = buffer.toString('ascii', 4, 8);
    if (signature === 'ftyp') {
        const brand = buffer.toString('ascii', 8, 12).toLowerCase();
        if (brand.startsWith('qt')) {
            return 'video/quicktime';
        }
        return 'video/mp4';
    }

    return null;
}

function resolveExtension(mimeType, originalName) {
    const normalized = normalizeClaimedMime(mimeType);
    if (MIME_TO_EXT[normalized]) {
        return MIME_TO_EXT[normalized];
    }
    const ext = path.extname(originalName || '').toLowerCase();
    if (['.mp4', '.webm', '.mov'].includes(ext)) {
        return ext;
    }
    return '.mp4';
}

/**
 * @throws {{ code: 'INVALID_VIDEO', message: string }}
 */
function validateVideoBuffer(buffer, mimeType) {
    if (!buffer || !buffer.length) {
        const err = new Error('Video file is empty');
        err.code = 'INVALID_VIDEO';
        throw err;
    }

    const claimedMime = normalizeClaimedMime(mimeType);
    if (!ALLOWED_VIDEO_MIME_TYPES.has(claimedMime)) {
        const err = new Error('Unsupported video type. Use MP4, WebM, or MOV.');
        err.code = 'INVALID_VIDEO';
        throw err;
    }

    const detectedMime = detectVideoMime(buffer);
    if (!detectedMime || !ALLOWED_VIDEO_MIME_TYPES.has(detectedMime)) {
        const err = new Error('File is not a valid MP4, WebM, or MOV video.');
        err.code = 'INVALID_VIDEO';
        throw err;
    }

    return detectedMime;
}

module.exports = {
    ALLOWED_VIDEO_MIME_TYPES,
    MIME_TO_EXT,
    normalizeClaimedMime,
    detectVideoMime,
    resolveExtension,
    validateVideoBuffer
};
