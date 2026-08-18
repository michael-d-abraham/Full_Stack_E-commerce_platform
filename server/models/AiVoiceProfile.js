const mongoose = require('mongoose');

// One document per named profile; the admin UI uses the 'default' profile.
// Three fields replace the old single voiceNote so the AI gets structured guidance.
const aiVoiceProfileSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, default: 'default' },
        brandIdentity: { type: String, default: '' },
        emphasize: { type: String, default: '' },
        avoid: { type: String, default: '' }
    },
    {
        timestamps: true,
        collection: 'ai_voice_profiles'
    }
);

module.exports =
    mongoose.models.AiVoiceProfile ||
    mongoose.model('AiVoiceProfile', aiVoiceProfileSchema);
