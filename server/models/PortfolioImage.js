const mongoose = require('mongoose');

const portfolioImageSchema = new mongoose.Schema({
    portfolio_work_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PortfolioWork',
        required: true
    },
    image_url: { type: String, required: true },
    image_provider_id: { type: String, default: null },
    alt_text: { type: String, default: null },
    sort_order: { type: Number, required: true, default: 0 },
    is_primary: { type: Boolean, required: true, default: false },
    is_active: { type: Boolean, required: true, default: true },
    deleted_at: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'portfolio_images'
});

module.exports =
    mongoose.models.PortfolioImage || mongoose.model('PortfolioImage', portfolioImageSchema);
