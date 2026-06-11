const mongoose = require('mongoose');

const aiPreferredExampleSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ['hook', 'caption', 'cta', 'hashtag']
        },
        text: { type: String, required: true },
        source: { type: String, required: true, default: 'instagram-generator' },
        active: { type: Boolean, required: true, default: true }
    },
    {
        timestamps: true,
        collection: 'ai_preferred_examples'
    }
);

module.exports =
    mongoose.models.AiPreferredExample ||
    mongoose.model('AiPreferredExample', aiPreferredExampleSchema);
