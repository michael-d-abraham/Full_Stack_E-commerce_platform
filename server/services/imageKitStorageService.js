const { randomUUID } = require('crypto');
const ImageKit = require('@imagekit/nodejs');
const { toFile } = require('@imagekit/nodejs');
const { resolveExtension, validateImageBuffer } = require('../utils/imageMime');
const { normalizeImageKitFileId } = require('../utils/imageKitFileIds');

const ALLOWED_FOLDERS = new Set([
    'products',
    'portfolio',
    'site/hero',
    'site/hero-background',
    'site/featured-background',
    'site/about-background',
    'site/about',
    'site/contact',
    'site/logo'
]);

const DEFAULT_FOLDER = 'products';

let imageKitClient = null;

function assertImageKitConfig() {
    const required = ['IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_URL_ENDPOINT'];
    const missing = required.filter((key) => !process.env[key] || !String(process.env[key]).trim());
    if (missing.length) {
        const err = new Error(`ImageKit storage is not configured. Missing: ${missing.join(', ')}`);
        err.code = 'IMAGEKIT_NOT_CONFIGURED';
        throw err;
    }
}

function getImageKitClient() {
    assertImageKitConfig();
    if (!imageKitClient) {
        imageKitClient = new ImageKit({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY
        });
    }
    return imageKitClient;
}

/**
 * Normalize folder input to an allowed ImageKit folder key (no leading/trailing slashes).
 * @param {string|undefined} folder
 * @returns {string}
 */
function normalizeUploadFolder(folder) {
    if (folder === undefined || folder === null || !String(folder).trim()) {
        return DEFAULT_FOLDER;
    }
    const cleaned = String(folder).trim().replace(/^\/+|\/+$/g, '');
    if (!ALLOWED_FOLDERS.has(cleaned)) {
        const err = new Error(
            `Invalid upload folder "${cleaned}". Allowed: ${[...ALLOWED_FOLDERS].join(', ')}`
        );
        err.code = 'INVALID_FOLDER';
        throw err;
    }
    return cleaned;
}

/**
 * Upload a validated image buffer to the ImageKit Media Library.
 * @returns {Promise<{ url: string, fileId: string, name: string, filePath: string, thumbnailUrl: string|null, width: number|null, height: number|null, size: number|null }>}
 */
async function uploadImageToImageKit({ buffer, mimeType, originalName, folder }) {
    const mime = validateImageBuffer(buffer, mimeType);
    const folderKey = normalizeUploadFolder(folder);
    const ext = resolveExtension(mime, originalName);
    const fileName = `${randomUUID()}${ext}`;

    const client = getImageKitClient();
    const response = await client.files.upload({
        file: await toFile(buffer, fileName),
        fileName,
        folder: `/${folderKey}`
    });

    return {
        url: response.url || '',
        fileId: response.fileId || '',
        name: response.name || fileName,
        filePath: response.filePath || `/${folderKey}/${fileName}`,
        thumbnailUrl: response.thumbnailUrl ?? null,
        width: response.width ?? null,
        height: response.height ?? null,
        size: response.size ?? null
    };
}

/**
 * Delete a file from ImageKit by file ID. Skips empty IDs; never throws.
 * @returns {Promise<{ ok: boolean, fileId?: string, skipped?: boolean, error?: string }>}
 */
async function deleteImageFromImageKit(fileId) {
    const id = normalizeImageKitFileId(fileId);
    if (!id) {
        return { ok: true, skipped: true };
    }

    try {
        const client = getImageKitClient();
        await client.files.delete(id);
        return { ok: true, fileId: id };
    } catch (err) {
        console.error('ImageKit delete failed', {
            fileId: id,
            error: err && err.message ? err.message : String(err)
        });
        return {
            ok: false,
            fileId: id,
            error: err && err.message ? err.message : String(err)
        };
    }
}

/**
 * Best-effort delete for multiple ImageKit file IDs (deduped).
 * @param {string[]} fileIds
 * @returns {Promise<Array<{ ok: boolean, fileId?: string, skipped?: boolean, error?: string }>>}
 */
async function deleteImageKitFilesBestEffort(fileIds) {
    const unique = [];
    const seen = new Set();
    for (const raw of fileIds || []) {
        const id = normalizeImageKitFileId(raw);
        if (id && !seen.has(id)) {
            seen.add(id);
            unique.push(id);
        }
    }

    const results = [];
    for (const id of unique) {
        results.push(await deleteImageFromImageKit(id));
    }
    return results;
}

module.exports = {
    uploadImageToImageKit,
    deleteImageFromImageKit,
    deleteImageKitFilesBestEffort,
    assertImageKitConfig,
    normalizeUploadFolder,
    ALLOWED_FOLDERS,
    DEFAULT_FOLDER
};
