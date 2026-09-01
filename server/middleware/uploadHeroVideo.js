const multer = require('multer');

const MAX_FILE_BYTES = 50 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES },
    fileFilter(req, file, cb) {
        if (file.mimetype && file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'));
        }
    }
});

function uploadHeroVideoMiddleware(req, res, next) {
    upload.single('video')(req, res, function (err) {
        if (err) {
            const message =
                err.code === 'LIMIT_FILE_SIZE'
                    ? 'Video must be 50 MB or smaller'
                    : err.message || 'Invalid upload';
            return res.status(400).json({ error: message });
        }
        next();
    });
}

module.exports = { uploadHeroVideoMiddleware };
