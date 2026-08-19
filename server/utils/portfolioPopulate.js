const PORTFOLIO_POPULATE_PATHS = ['portfolio_images'];

function applyPortfolioRelations(query) {
    return query.populate(PORTFOLIO_POPULATE_PATHS);
}

module.exports = {
    PORTFOLIO_POPULATE_PATHS,
    applyPortfolioRelations
};
