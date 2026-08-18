const MIME_TO_EXT = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
};

const TRANSPARENCY_MIMES = new Set(['image/png', 'image/webp']);

const EXT_TO_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
};

/**
 * Normalize a MIME type (e.g. image/jpg → image/jpeg).
 * @param {string|undefined|null} mime
 * @returns {string}
 */
function normalizeImageMime(mime) {
    const value = String(mime || '')
        .toLowerCase()
        .trim();
    if (value === 'image/jpg') {
        return 'image/jpeg';
    }
    return value;
}

/**
 * File extension from a name (browser-safe; no Node path module).
 * @param {string|undefined|null} fileName
 * @returns {string}
 */
function extname(fileName) {
    const name = String(fileName || '');
    const dot = name.lastIndexOf('.');
    if (dot <= 0) {
        return '';
    }
    return name.slice(dot).toLowerCase();
}

/**
 * Infer MIME from a file name extension.
 * @param {string|undefined|null} fileName
 * @returns {string}
 */
function mimeFromFileName(fileName) {
    const ext = extname(fileName);
    return EXT_TO_MIME[ext] || '';
}

/**
 * Whether the MIME type supports alpha transparency on export.
 * @param {string|undefined|null} mime
 * @returns {boolean}
 */
function mimeSupportsAlpha(mime) {
    return TRANSPARENCY_MIMES.has(normalizeImageMime(mime));
}

/**
 * Whether the file should bypass the raster crop editor (SVG stays vector).
 * @param {string|undefined|null} mime
 * @returns {boolean}
 */
function shouldSkipRasterEditor(mime) {
    return normalizeImageMime(mime) === 'image/svg+xml';
}

/**
 * File extension for a MIME type.
 * @param {string|undefined|null} mime
 * @returns {string}
 */
function extensionFromMime(mime) {
    return MIME_TO_EXT[normalizeImageMime(mime)] || '.jpg';
}

/**
 * Resolve editor export settings from the uploaded source file.
 * Preserves PNG/WebP/SVG formats; JPEG sources stay JPEG.
 *
 * @param {{ sourceMime?: string, sourceName?: string, outputBaseName?: string }} options
 * @returns {{ skipEditor: boolean, outputMime: string, outputFileName: string, outputQuality?: number }}
 */
function resolveEditorOutputFromSource({ sourceMime, sourceName, outputBaseName = 'photo' }) {
    const baseName = String(outputBaseName || 'photo').replace(/\.(png|webp|jpe?g|svg)$/i, '');
    const detectedMime =
        normalizeImageMime(sourceMime) || mimeFromFileName(sourceName) || 'image/jpeg';

    if (shouldSkipRasterEditor(detectedMime)) {
        return {
            skipEditor: true,
            outputMime: 'image/svg+xml',
            outputFileName: `${baseName}.svg`
        };
    }

    if (mimeSupportsAlpha(detectedMime)) {
        const outputMime = detectedMime === 'image/webp' ? 'image/webp' : 'image/png';
        return {
            skipEditor: false,
            outputMime,
            outputFileName: `${baseName}${extensionFromMime(outputMime)}`,
            outputQuality: outputMime === 'image/webp' ? 0.92 : undefined
        };
    }

    return {
        skipEditor: false,
        outputMime: 'image/jpeg',
        outputFileName: `${baseName}.jpg`,
        outputQuality: 0.92
    };
}

module.exports = {
    MIME_TO_EXT,
    TRANSPARENCY_MIMES,
    normalizeImageMime,
    mimeFromFileName,
    mimeSupportsAlpha,
    shouldSkipRasterEditor,
    extensionFromMime,
    resolveEditorOutputFromSource
};
