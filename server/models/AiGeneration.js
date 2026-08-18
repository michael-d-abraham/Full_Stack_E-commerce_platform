const mongoose = require('mongoose');

// Write-once record of every successful AI generation.
// Stores what went in (description, tone, focus) and what came out (the validated copy).
// voiceNote and preferredExamplesUsed were removed because the agentic graph fetches those
// via tool calls internally and does not surface them in the final state.
const aiGenerationSchema = new mongoose.Schema(
    {
        inputDescription: { type: String, required: true },
        tone: { type: String, required: true },
        focus: { type: String, required: true },
        output: {
            hooks: { type: [String], default: [] },
            captions: { type: [String], default: [] },
            ctas: { type: [String], default: [] },
            hashtags: { type: [String], default: [] }
        }
    },
    {
        timestamps: true,
        collection: 'ai_generations'
    }
);

module.exports =
    mongoose.models.AiGeneration ||
    mongoose.model('AiGeneration', aiGenerationSchema);
