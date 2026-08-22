const express = require('express');
const router = express.Router();

const {
    listAdminPortfolio,
    getAdminPortfolioById,
    createAdminPortfolio,
    updateAdminPortfolio,
    softDeleteAdminPortfolio,
    toggleAdminPortfolioActive
} = require('../controllers/adminPortfolioController');

router.get('/', listAdminPortfolio);
router.post('/', createAdminPortfolio);
router.patch('/:id/toggle-active', toggleAdminPortfolioActive);
router.get('/:id', getAdminPortfolioById);
router.put('/:id', updateAdminPortfolio);
router.delete('/:id', softDeleteAdminPortfolio);

module.exports = router;
