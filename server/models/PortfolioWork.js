const mongoose = require('mongoose');

/**
 * Finished tattoo portfolio piece — gallery display (no price).
 */
const portfolioWorkSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    sort_order: { type: Number, required: true, default: 0 },
    is_active: { type: Boolean, required: true, default: true },
    deleted_at: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'portfolio_works',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

portfolioWorkSchema.virtual('portfolio_images', {
    ref: 'PortfolioImage',
    localField: '_id',
    foreignField: 'portfolio_work_id',
    options: {
        sort: { sort_order: 1, created_at: 1 },
        match: { deleted_at: null }
    }
});

module.exports =
    mongoose.models.PortfolioWork || mongoose.model('PortfolioWork', portfolioWorkSchema);
