const express = require('express');
const {
    getAdminSocialSettingsHandler,
    updateAdminSocialSettingsHandler,
    getAdminDisplayPicturesHandler,
    updateAdminDisplayPicturesHandler,
    getAdminHomePageHandler,
    updateAdminHomePageHandler,
    getAdminBookPageHandler,
    updateAdminBookPageHandler,
    getAdminSiteBrandingHandler,
    updateAdminSiteBrandingHandler
} = require('../controllers/siteSettingsController');

const router = express.Router();

router.get('/site-branding', getAdminSiteBrandingHandler);
router.put('/site-branding', updateAdminSiteBrandingHandler);
router.get('/social-links', getAdminSocialSettingsHandler);
router.put('/social-links', updateAdminSocialSettingsHandler);
router.get('/display-pictures', getAdminDisplayPicturesHandler);
router.put('/display-pictures', updateAdminDisplayPicturesHandler);
router.get('/home-page', getAdminHomePageHandler);
router.put('/home-page', updateAdminHomePageHandler);
router.get('/book-page', getAdminBookPageHandler);
router.put('/book-page', updateAdminBookPageHandler);

module.exports = router;
