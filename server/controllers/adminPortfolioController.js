const { PortfolioWork } = require('../db');
const { isValidObjectId } = require('../utils/objectIdValidation');
const { normalizeSlug } = require('../utils/slugify');
const { buildUniquePortfolioSlug } = require('../utils/portfolioSlug');
const {
    validatePortfolioCreateBody,
    validatePortfolioUpdateBody
} = require('../utils/portfolioValidation');
const { applyPortfolioRelations } = require('../utils/portfolioPopulate');
const {
    normalizeImages,
    createImagesForPortfolioWork,
    syncImagesForPortfolioWork,
    softDeletePortfolioImagesWithCleanup
} = require('../utils/portfolioImages');

function isDuplicateKeyError(err) {
    return err && err.code === 11000;
}

function validationErrorResponse(res, messageOrResult) {
    if (messageOrResult && messageOrResult.errors) {
        return res.status(400).json({ errors: messageOrResult.errors });
    }
    return res.status(400).json({
        error: typeof messageOrResult === 'string' ? messageOrResult : 'Validation failed'
    });
}

async function getAdminPortfolioDetailById(id) {
    if (!isValidObjectId(id)) {
        return null;
    }
    return applyPortfolioRelations(
        PortfolioWork.findOne({ _id: id, deleted_at: null })
    ).exec();
}

const listAdminPortfolio = async (req, res) => {
    try {
        const works = await applyPortfolioRelations(
            PortfolioWork.find({ deleted_at: null }).sort({ sort_order: 1, created_at: -1 })
        ).exec();
        res.json(works);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAdminPortfolioById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid portfolio id' });
        }

        const work = await getAdminPortfolioDetailById(id);
        if (!work) {
            return res.status(404).json({ error: 'Portfolio work not found' });
        }

        res.json(work);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createAdminPortfolio = async (req, res) => {
    try {
        const body = req.body;
        const createErr = validatePortfolioCreateBody(body);
        if (createErr) {
            return validationErrorResponse(res, createErr);
        }

        let slug;
        if (body.slug != null && String(body.slug).trim() !== '') {
            slug = normalizeSlug(body.slug);
            if (!slug) {
                return res.status(400).json({ error: 'slug is invalid' });
            }
            const taken = await PortfolioWork.exists({ slug });
            if (taken) {
                return res.status(400).json({ error: 'Slug already exists' });
            }
        } else {
            slug = await buildUniquePortfolioSlug(body.title || 'work');
            if (!slug) {
                return res.status(400).json({ error: 'slug could not be generated' });
            }
        }

        const doc = {
            title: body.title != null ? String(body.title).trim() : '',
            slug,
            description: body.description != null ? String(body.description).trim() : '',
            sort_order:
                typeof body.sort_order === 'number' && Number.isInteger(body.sort_order)
                    ? body.sort_order
                    : 0,
            is_active: body.is_active !== undefined ? body.is_active : true,
            deleted_at: null
        };

        const work = await PortfolioWork.create(doc);
        const rawImages = Array.isArray(body.images) ? body.images : [];
        await createImagesForPortfolioWork(work._id, normalizeImages(rawImages));

        const populated = await getAdminPortfolioDetailById(work._id.toString());
        res.status(201).json(populated);
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(400).json({ error: 'Duplicate portfolio work or slug' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateAdminPortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid portfolio id' });
        }

        const body = req.body;
        const updateErr = validatePortfolioUpdateBody(body);
        if (updateErr) {
            return validationErrorResponse(res, updateErr);
        }

        const work = await PortfolioWork.findOne({ _id: id, deleted_at: null });
        if (!work) {
            return res.status(404).json({ error: 'Portfolio work not found' });
        }

        if (body.title !== undefined) {
            work.title = String(body.title).trim();
        }
        if (body.description !== undefined) {
            work.description = String(body.description).trim();
        }
        if (body.is_active !== undefined) {
            work.is_active = body.is_active;
        }
        if (body.sort_order !== undefined && Number.isInteger(body.sort_order)) {
            work.sort_order = body.sort_order;
        }

        if (body.slug !== undefined) {
            const nextSlug = normalizeSlug(body.slug);
            if (!nextSlug) {
                return res.status(400).json({ error: 'slug is invalid' });
            }
            if (nextSlug !== work.slug) {
                const taken = await PortfolioWork.exists({ slug: nextSlug, _id: { $ne: work._id } });
                if (taken) {
                    return res.status(400).json({ error: 'Slug already exists' });
                }
                work.slug = nextSlug;
            }
        } else if (body.title !== undefined) {
            const nextSlug = await buildUniquePortfolioSlug(body.title || 'work', work._id);
            if (nextSlug && nextSlug !== work.slug) {
                work.slug = nextSlug;
            }
        }

        await work.save();

        if (body.images !== undefined) {
            await syncImagesForPortfolioWork(work._id, body.images);
        }

        const populated = await getAdminPortfolioDetailById(work._id.toString());
        res.json(populated);
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(400).json({ error: 'Duplicate portfolio work or slug' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const softDeleteAdminPortfolio = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid portfolio id' });
        }

        const now = new Date();
        const work = await PortfolioWork.findOneAndUpdate(
            { _id: id, deleted_at: null },
            { deleted_at: now, is_active: false },
            { new: true }
        );

        if (!work) {
            return res.status(404).json({ error: 'Portfolio work not found' });
        }

        await softDeletePortfolioImagesWithCleanup(work._id, now);

        res.json(work);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const toggleAdminPortfolioActive = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid portfolio id' });
        }

        const work = await PortfolioWork.findOne({ _id: id, deleted_at: null });
        if (!work) {
            return res.status(404).json({ error: 'Portfolio work not found' });
        }

        work.is_active = !work.is_active;
        await work.save();
        res.json(work);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    listAdminPortfolio,
    getAdminPortfolioById,
    createAdminPortfolio,
    updateAdminPortfolio,
    softDeleteAdminPortfolio,
    toggleAdminPortfolioActive,
    getAdminPortfolioDetailById
};
