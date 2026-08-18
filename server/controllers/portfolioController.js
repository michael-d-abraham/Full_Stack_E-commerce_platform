const { PortfolioWork } = require('../db');
const { applyPortfolioRelations } = require('../utils/portfolioPopulate');
const {
    toPublicPortfolioListItem,
    toPublicPortfolioDetail
} = require('../utils/publicPortfolioDto');

const listPublicPortfolio = async (req, res) => {
    try {
        const works = await applyPortfolioRelations(
            PortfolioWork.find({
                is_active: true,
                deleted_at: null
            }).lean()
        )
            .sort({ sort_order: 1, created_at: -1 })
            .exec();

        res.json(works.map(toPublicPortfolioListItem).filter(Boolean));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getPublicPortfolioBySlug = async (req, res) => {
    try {
        const slug = req.params.slug;
        if (slug == null || String(slug).trim() === '') {
            return res.status(400).json({ error: 'Invalid slug' });
        }

        const work = await applyPortfolioRelations(
            PortfolioWork.findOne({
                slug: String(slug).trim(),
                is_active: true,
                deleted_at: null
            }).lean()
        ).exec();

        if (!work) {
            return res.status(404).json({ error: 'Portfolio work not found' });
        }

        res.json(toPublicPortfolioDetail(work));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    listPublicPortfolio,
    getPublicPortfolioBySlug
};
