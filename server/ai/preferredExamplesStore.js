
// MongoDB-backed preferred examples store.
// Replaces the previous in-memory FIFO stacks — hearted lines now survive server restarts.
//
// Behaviour mirrors the old in-memory FIFO approach:
//   - Only the MAX_ITEMS most recent *active* examples per type are ever returned.
//   - After each save the oldest active records beyond MAX_ITEMS are soft-deactivated
//     (active: false) rather than deleted, so history is preserved.

const MAX_ITEMS = 5;

function getModel() {
    return require('../models/AiPreferredExample');
}

/*
 * getPreferredExamples — returns the latest active examples for hooks, captions, and ctas.
 * Each array is capped at MAX_ITEMS, newest-first.
 */
async function getPreferredExamples() {
    const AiPreferredExample = getModel();
    const [hooks, captions, ctas] = await Promise.all(
        ['hook', 'caption', 'cta'].map((type) =>
            AiPreferredExample.find({ type, active: true })
                .sort({ createdAt: -1 })
                .limit(MAX_ITEMS)
                .lean()
                .then((docs) => docs.map((d) => d.text))
        )
    );
    return { hooks, captions, ctas };
}

/*
 * savePreferredExample — inserts a new example and soft-deactivates any that push the
 * active count for that type over MAX_ITEMS (oldest deactivated first).
 */
async function savePreferredExample(type, text) {
    const AiPreferredExample = getModel();
    const t = String(text).trim();
    if (!t) return;
    if (!['hook', 'caption', 'cta', 'hashtag'].includes(type)) return;

    await AiPreferredExample.create({
        type,
        text: t,
        source: 'instagram-generator',
        active: true
    });

    // Soft-deactivate anything beyond the newest MAX_ITEMS active docs for this type.
    const overflow = await AiPreferredExample.find({ type, active: true })
        .sort({ createdAt: -1 })
        .skip(MAX_ITEMS)
        .lean();

    if (overflow.length > 0) {
        const ids = overflow.map((d) => d._id);
        await AiPreferredExample.updateMany({ _id: { $in: ids } }, { $set: { active: false } });
    }
}

module.exports = {
    getPreferredExamples,
    savePreferredExample
};
