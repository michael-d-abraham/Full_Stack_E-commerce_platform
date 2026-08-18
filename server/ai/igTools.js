/*
 * LangChain tools available to the Instagram copy agent.
 *
 * Tools:
 *   fetch_preferred_copy_examples — loads hearted hooks/captions/CTAs from MongoDB (few-shot style refs).
 *   get_artist_voice_profile      — loads the artist's brand identity, emphasis points, and avoidance rules.
 *
 * The agent (in igGenerationGraph.js) binds these tools via modelProvider and decides when to call them.
 * Code never invokes them directly — that is the model's job.
 */

const { tool } = require('@langchain/core/tools');
const z = require('zod');

const { getPreferredExamples } = require('./preferredExamplesStore');

// ─── fetch_preferred_copy_examples ────────────────────────────────────────────

const fetchPreferredCopyExamplesTool = tool(
    async (input) => {
        const { hooks, captions, ctas } = await getPreferredExamples();
        const cat = input.categories || 'all';
        if (cat === 'hooks')    return JSON.stringify({ hooks, captions: [], ctas: [] });
        if (cat === 'captions') return JSON.stringify({ hooks: [], captions, ctas: [] });
        if (cat === 'ctas')     return JSON.stringify({ hooks: [], captions: [], ctas });
        return JSON.stringify({ hooks, captions, ctas });
    },
    {
        name: 'fetch_preferred_copy_examples',
        description:
            'Loads up to five user-approved hook, caption, and CTA examples per category from the database. ' +
            'Use these as style and tone references when writing copy. ' +
            'Pass categories="all" unless you only need one type.',
        schema: z.object({
            categories: z
                .enum(['all', 'hooks', 'captions', 'ctas'])
                .optional()
                .default('all')
                .describe('Which category of examples to return.')
        })
    }
);

// ─── get_artist_voice_profile ─────────────────────────────────────────────────

const getArtistVoiceProfileTool = tool(
    async () => {
        // Lazy require avoids circular dependency at startup.
        const AiVoiceProfile = require('../models/AiVoiceProfile');
        const profile = await AiVoiceProfile.findOne({ name: 'default' }).lean();
        if (!profile) {
            return JSON.stringify({ brandIdentity: '', emphasize: '', avoid: '' });
        }
        return JSON.stringify({
            brandIdentity: profile.brandIdentity || '',
            emphasize: profile.emphasize || '',
            avoid: profile.avoid || ''
        });
    },
    {
        name: 'get_artist_voice_profile',
        description:
            'Loads the artist\'s saved brand and style preferences: ' +
            'brandIdentity (who they are and what they create), ' +
            'emphasize (themes and selling points to highlight), and ' +
            'avoid (words, styles, or tones to exclude). ' +
            'Call this to make copy feel personal and on-brand.',
        schema: z.object({})
    }
);

module.exports = {
    fetchPreferredCopyExamplesTool,
    getArtistVoiceProfileTool
};
