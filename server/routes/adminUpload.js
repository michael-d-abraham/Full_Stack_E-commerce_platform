const express = require('express');
const router = express.Router();

const { uploadImage, uploadVideo } = require('../controllers/adminUploadController');
const { uploadProductImageMiddleware } = require('../middleware/uploadProductImage');
const { uploadHeroVideoMiddleware } = require('../middleware/uploadHeroVideo');

router.post('/upload-image', uploadProductImageMiddleware, uploadImage);
router.post('/upload-video', uploadHeroVideoMiddleware, uploadVideo);

module.exports = router;
