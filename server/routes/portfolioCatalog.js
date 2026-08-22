const express = require('express');
const {
    listPublicPortfolio,
    getPublicPortfolioBySlug
} = require('../controllers/portfolioController');

const listRouter = express.Router();
listRouter.get('/', listPublicPortfolio);

const detailRouter = express.Router();
detailRouter.get('/:slug', getPublicPortfolioBySlug);

module.exports = {
    listRouter,
    detailRouter
};
