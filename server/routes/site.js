const express = require('express');
const {
    getPublicSocialLinksHandler,
    getPublicContactHeroHandler,
    getPublicContactEmailHandler,
    getPublicHomePageHandler,
    getPublicBookPageHandler,
    getPublicNavVisibilityHandler
} = require('../controllers/siteSettingsController');

const router = express.Router();

router.get('/social-links', getPublicSocialLinksHandler);
router.get('/contact-hero', getPublicContactHeroHandler);
router.get('/contact-email', getPublicContactEmailHandler);
router.get('/home-page', getPublicHomePageHandler);
router.get('/book-page', getPublicBookPageHandler);
router.get('/nav-visibility', getPublicNavVisibilityHandler);

module.exports = router;
