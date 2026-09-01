const { uploadImageToImageKit, uploadVideoToImageKit } = require('../services/imageKitStorageService');

async function uploadImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided. Use field name "image".' });
        }

        const folder = req.body && req.body.folder !== undefined ? req.body.folder : undefined;

        const uploaded = await uploadImageToImageKit({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            folder
        });

        const payload = { image_url: uploaded.url };
        if (uploaded.fileId) {
            payload.file_id = uploaded.fileId;
        }

        return res.json(payload);
    } catch (err) {
        console.error('admin upload-image', err);

        if (err.code === 'IMAGEKIT_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Image storage is not configured on the server.' });
        }
        if (err.code === 'INVALID_IMAGE' || err.code === 'INVALID_FOLDER') {
            return res.status(400).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Failed to upload image' });
    }
}

async function uploadVideo(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided. Use field name "video".' });
        }

        const folder = req.body && req.body.folder !== undefined ? req.body.folder : undefined;

        const uploaded = await uploadVideoToImageKit({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            folder
        });

        const payload = { image_url: uploaded.url };
        if (uploaded.fileId) {
            payload.file_id = uploaded.fileId;
        }

        return res.json(payload);
    } catch (err) {
        console.error('admin upload-video', err);

        if (err.code === 'IMAGEKIT_NOT_CONFIGURED') {
            return res.status(503).json({ error: 'Image storage is not configured on the server.' });
        }
        if (err.code === 'INVALID_VIDEO' || err.code === 'INVALID_FOLDER') {
            return res.status(400).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Failed to upload video' });
    }
}

module.exports = { uploadImage, uploadVideo };
