const path = require('path');

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif'
]);

const MIME_TO_EXT = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/gif': '.gif'
};

function normalizeClaimedMime(mimeType) {
    const mime = String(mimeType || '').toLowerCase();
    if (mime === 'image/jpg') {
        return 'image/jpeg';
    }
    return mime;
}

/**
 * Detect the real image type from the file's magic bytes so we never trust the
 * client-supplied Content-Type. Returns a MIME string or null if unrecognized.
 * @param {Buffer} buffer
 * @returns {string|null}
 */
function detectImageMime(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
        return null;
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return 'image/jpeg';
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return 'image/png';
    }
    // GIF: "GIF8"
    if (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38
    ) {
        return 'image/gif';
    }
    // WEBP: "RIFF" .... "WEBP"
    if (
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return 'image/webp';
    }
    // SVG: XML document containing an <svg root (after optional BOM/whitespace)
    const head = buffer.toString('utf8', 0, Math.min(buffer.length, 4096)).trim();
    if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
        return 'image/svg+xml';
    }
    return null;
}

function resolveExtension(mimeType, originalName) {
    const normalized = normalizeClaimedMime(mimeType);
    if (MIME_TO_EXT[normalized]) {
        return MIME_TO_EXT[normalized];
    }
    const ext = path.extname(originalName || '').toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext)) {
        return ext === '.jpeg' ? '.jpg' : ext;
    }
    return '.jpg';
}

/**
 * Validate buffer and claimed MIME; returns detected MIME on success.
 * @throws {{ code: 'INVALID_IMAGE', message: string }}
 */
function validateImageBuffer(buffer, mimeType) {
    if (!buffer || !buffer.length) {
        const err = new Error('Image file is empty');
        err.code = 'INVALID_IMAGE';
        throw err;
    }

    const claimedMime = normalizeClaimedMime(mimeType);
    if (!ALLOWED_MIME_TYPES.has(claimedMime)) {
        const err = new Error('Unsupported image type. Use JPEG, PNG, WebP, SVG, or GIF.');
        err.code = 'INVALID_IMAGE';
        throw err;
    }

    const detectedMime = detectImageMime(buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.has(detectedMime)) {
        const err = new Error('File is not a valid JPEG, PNG, WebP, SVG, or GIF image.');
        err.code = 'INVALID_IMAGE';
        throw err;
    }

    return detectedMime;
}

module.exports = {
    ALLOWED_MIME_TYPES,
    MIME_TO_EXT,
    normalizeClaimedMime,
    detectImageMime,
    resolveExtension,
    validateImageBuffer
};
