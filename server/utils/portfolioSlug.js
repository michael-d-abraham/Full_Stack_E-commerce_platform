const crypto = require('crypto');
const { PortfolioWork } = require('../db');
const { slugify } = require('./slugify');

async function buildUniquePortfolioSlug(title, excludeId = null) {
    const base = slugify(title) || `work-${crypto.randomBytes(4).toString('hex')}`;
    let candidate = base;
    let n = 0;
    while (true) {
        const filter = { slug: candidate };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }
        const taken = await PortfolioWork.exists(filter);
        if (!taken) {
            return candidate;
        }
        n += 1;
        const suffix = n < 3 ? String(n) : crypto.randomBytes(3).toString('hex');
        candidate = `${base}-${suffix}`;
    }
}

module.exports = {
    buildUniquePortfolioSlug
};
