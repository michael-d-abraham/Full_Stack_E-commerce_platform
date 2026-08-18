const { randomUUID } = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { detectImageMime, resolveExtension, validateImageBuffer } = require('../utils/imageMime');

let s3Client = null;

function assertR2Config() {
    const required = [
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_ENDPOINT',
        'R2_PUBLIC_URL'
    ];
    const missing = required.filter((key) => !process.env[key] || !String(process.env[key]).trim());
    if (missing.length) {
        const err = new Error(`R2 storage is not configured. Missing: ${missing.join(', ')}`);
        err.code = 'R2_NOT_CONFIGURED';
        throw err;
    }
}

function getS3Client() {
    assertR2Config();
    if (!s3Client) {
        s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
            }
        });
    }
    return s3Client;
}

function buildPublicUrl(key) {
    const base = String(process.env.R2_PUBLIC_URL).replace(/\/$/, '');
    return `${base}/${key}`;
}

/**
 * Upload a product image buffer to R2 under products/{uuid}.{ext}.
 * @returns {Promise<string>} Public image URL
 */
async function uploadProductImage({ buffer, mimeType, originalName }) {
    const mime = validateImageBuffer(buffer, mimeType);
    const ext = resolveExtension(mime, originalName);
    const filename = `${randomUUID()}${ext}`;
    const key = `products/${filename}`;

    const client = getS3Client();
    await client.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mime
        })
    );

    return buildPublicUrl(key);
}

module.exports = {
    uploadProductImage,
    assertR2Config,
    detectImageMime
};
