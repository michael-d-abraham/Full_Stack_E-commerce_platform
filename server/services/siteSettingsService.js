const mongoose = require('mongoose');
const { SiteSettings, Product } = require('../db');
const { applyProductRelations } = require('../utils/productPopulate');
const {
    primaryProductImageUrl,
    displayProductName,
    formatMoneyFromCents
} = require('../utils/storefrontProductDisplay');
const {
    PLATFORMS,
    DEFAULT_SOCIAL_LINKS,
    PLATFORM_LABELS,
    isValidHttpUrl
} = require('../utils/socialLinksDefaults');
const {
    FEATURED_PRODUCT_SLOTS,
    DEFAULT_HOME_PAGE,
    emptyFeaturedProduct,
    resolveHeroImageUrls,
    resolveHeroImageFileIds,
    resolveHeroMediaTypes,
    normalizeHeroMediaType,
    mergeHomePageTextDefaults
} = require('../utils/homePageDefaults');
const { withContactFormLabelDefaults } = require('../utils/contactPageDefaults');
const { mergeBookPageLabels } = require('../utils/bookPageDefaults');
const {
    resolveSiteBranding,
    toAdminSiteBranding,
    normalizeSiteBrandingInput
} = require('../utils/siteBrandDefaults');
const { isValidEmail } = require('../../shared/email');
const { deleteImageKitFilesBestEffort } = require('../services/imageKitStorageService');
const {
    collectFileIdsFromValues,
    fileIdsRemoved,
    collectStoredHomePageFileIds,
    collectParsedHomePageFileIds
} = require('../utils/imageKitFileIds');

const SETTINGS_KEY = 'default';

function normalizeSocialLinksInput(raw) {
    if (!raw || typeof raw !== 'object') {
        return { errors: ['social_links must be an object'] };
    }

    const errors = [];
    const social_links = {};

    for (const platform of PLATFORMS) {
        const entry = raw[platform];
        if (entry == null || typeof entry !== 'object') {
            errors.push(`social_links.${platform} is required`);
            continue;
        }

        const enabled = Boolean(entry.enabled);
        const url = entry.url != null ? String(entry.url).trim() : '';
        const defaultLabel =
            DEFAULT_SOCIAL_LINKS[platform].label || PLATFORM_LABELS[platform] || platform;
        const label =
            entry.label != null && String(entry.label).trim()
                ? String(entry.label).trim()
                : defaultLabel;

        if (enabled && !isValidHttpUrl(url)) {
            errors.push(
                `social_links.${platform}.url must be a valid http or https URL when enabled`
            );
            continue;
        }

        if (enabled && !label) {
            errors.push(`social_links.${platform}.label cannot be empty when enabled`);
            continue;
        }

        social_links[platform] = {
            url: enabled ? url : url || DEFAULT_SOCIAL_LINKS[platform].url,
            enabled,
            label: enabled ? label : label || defaultLabel
        };
    }

    if (errors.length) {
        return { errors };
    }

    return { social_links };
}

async function ensureSiteSettingsDoc() {
    let doc = await SiteSettings.findOne({ key: SETTINGS_KEY });
    if (!doc) {
        doc = await SiteSettings.create({
            key: SETTINGS_KEY,
            social_links: DEFAULT_SOCIAL_LINKS
        });
    }
    return doc;
}

function normalizeContactEmail(value) {
    if (value === undefined || value === null) {
        return { contact_email: '' };
    }
    const email = String(value).trim();
    if (!email) {
        return { contact_email: '' };
    }
    if (!isValidEmail(email)) {
        return { errors: ['contact_email must be a valid email address'] };
    }
    return { contact_email: email };
}

function toAdminPayload(doc) {
    const links = doc.social_links || {};
    const social_links = {};
    PLATFORMS.forEach((platform) => {
        const row = links[platform] || DEFAULT_SOCIAL_LINKS[platform];
        const defaultLabel =
            DEFAULT_SOCIAL_LINKS[platform].label || PLATFORM_LABELS[platform] || platform;
        social_links[platform] = {
            url: row.url || DEFAULT_SOCIAL_LINKS[platform].url,
            enabled: row.enabled !== false,
            label:
                row.label != null && String(row.label).trim()
                    ? String(row.label).trim()
                    : defaultLabel
        };
    });
    const contact_email =
        doc.contact_email != null ? String(doc.contact_email).trim() : '';
    return { social_links, contact_email };
}

function toPublicPayload(doc) {
    const links = doc.social_links || {};
    return PLATFORMS.filter((platform) => {
        const row = links[platform];
        return row && row.enabled && isValidHttpUrl(row.url);
    }).map((platform) => {
        const row = links[platform];
        const defaultLabel =
            DEFAULT_SOCIAL_LINKS[platform].label || PLATFORM_LABELS[platform] || platform;
        return {
            platform,
            url: String(row.url).trim(),
            label:
                row.label != null && String(row.label).trim()
                    ? String(row.label).trim()
                    : defaultLabel
        };
    });
}

async function getAdminSocialSettings() {
    const doc = await ensureSiteSettingsDoc();
    return toAdminPayload(doc);
}

async function getPublicSocialLinks() {
    const doc = await ensureSiteSettingsDoc();
    return { links: toPublicPayload(doc) };
}

async function getPublicContactEmail() {
    const doc = await ensureSiteSettingsDoc();
    const email = doc.contact_email != null ? String(doc.contact_email).trim() : '';
    return { email: email || null };
}

function toAdminSiteBrandingPayload(doc) {
    return toAdminSiteBranding({
        site_name: doc.site_name,
        site_name_mode: doc.site_name_mode,
        site_name_logo_url: doc.site_name_logo_url,
        site_name_logo_file_id: doc.site_name_logo_file_id
    });
}

function toPublicSiteBrandingPayload(doc) {
    return resolveSiteBranding({
        site_name: doc.site_name,
        site_name_mode: doc.site_name_mode,
        site_name_logo_url: doc.site_name_logo_url
    });
}

async function getAdminSiteBranding() {
    const doc = await ensureSiteSettingsDoc();
    return toAdminSiteBrandingPayload(doc);
}

async function getPublicSiteBranding() {
    const doc = await ensureSiteSettingsDoc();
    return toPublicSiteBrandingPayload(doc);
}

async function updateSiteBranding(body) {
    const parsed = normalizeSiteBrandingInput(body, { isValidHttpUrl });
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const existing = await ensureSiteSettingsDoc();
    const previousIds = collectFileIdsFromValues(existing.site_name_logo_file_id);
    const nextIds = collectFileIdsFromValues(parsed.site_name_logo_file_id);
    const toDelete = fileIdsRemoved(previousIds, nextIds);

    const doc = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        {
            $set: {
                site_name: parsed.site_name,
                site_name_mode: parsed.site_name_mode,
                site_name_logo_url: parsed.site_name_logo_url,
                site_name_logo_file_id: parsed.site_name_logo_file_id
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (toDelete.length) {
        await deleteImageKitFilesBestEffort(toDelete);
    }

    return { ok: true, settings: toAdminSiteBrandingPayload(doc) };
}

function normalizeContactHeroImageUrl(value) {
    if (value === undefined || value === null) {
        return { contact_hero_image_url: '' };
    }
    const url = String(value).trim();
    if (!url) {
        return { contact_hero_image_url: '' };
    }
    if (!isValidHttpUrl(url)) {
        return { errors: ['contact_hero_image_url must be a valid http or https URL'] };
    }
    return { contact_hero_image_url: url };
}

function mergeContactPageStored(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};

    return {
        show_in_nav:
            base.show_in_nav === true || base.show_in_nav === false
                ? base.show_in_nav
                : true,
        show_hero_image: base.show_hero_image !== false,
        page_title: normalizeOptionalText(base.page_title),
        form_name_label: normalizeOptionalText(base.form_name_label),
        form_email_label: normalizeOptionalText(base.form_email_label),
        form_subject_label: normalizeOptionalText(base.form_subject_label),
        form_message_label: normalizeOptionalText(base.form_message_label),
        form_submit_label: normalizeOptionalText(base.form_submit_label),
        success_message: normalizeOptionalText(base.success_message)
    };
}

function toContactPageAdminPayload(doc) {
    const heroUrl =
        doc.contact_hero_image_url != null ? String(doc.contact_hero_image_url).trim() : '';
    const heroFileId =
        doc.contact_hero_image_file_id != null
            ? String(doc.contact_hero_image_file_id).trim()
            : '';
    const page = mergeContactPageStored(doc.contact_page);

    return {
        contact_hero_image_url: heroUrl,
        contact_hero_image_file_id: heroFileId,
        ...page
    };
}

async function getAdminDisplayPictures() {
    const doc = await ensureSiteSettingsDoc();
    return toContactPageAdminPayload(doc);
}

async function getPublicContactHero() {
    const doc = await ensureSiteSettingsDoc();
    const heroUrl =
        doc.contact_hero_image_url != null ? String(doc.contact_hero_image_url).trim() : '';
    const page = withContactFormLabelDefaults(doc.contact_page);

    return {
        image_url: heroUrl || null,
        ...page
    };
}

function toBookPageAdminPayload(doc) {
    const base = doc.book_page || {};
    return {
        show_in_nav:
            base.show_in_nav === true || base.show_in_nav === false
                ? base.show_in_nav
                : true,
        booking_url: normalizeOptionalText(base.booking_url),
        page_title: normalizeOptionalText(base.page_title),
        body_text: normalizeOptionalText(base.body_text),
        button_label: normalizeOptionalText(base.button_label)
    };
}

async function getAdminBookPage() {
    const doc = await ensureSiteSettingsDoc();
    return toBookPageAdminPayload(doc);
}

async function getPublicBookPage() {
    const doc = await ensureSiteSettingsDoc();
    return mergeBookPageLabels(doc.book_page);
}

async function getPublicNavVisibility() {
    const doc = await ensureSiteSettingsDoc();
    const contact = withContactFormLabelDefaults(doc.contact_page);
    const book = mergeBookPageLabels(doc.book_page);

    return {
        contact: contact.show_in_nav !== false,
        book: book.show_in_nav !== false
    };
}

function normalizeBookPageInput(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { errors: ['Request body is required'] };
    }

    const textFields = ['booking_url', 'page_title', 'body_text', 'button_label'];
    const normalized = {};

    for (const field of textFields) {
        if (body[field] === undefined || body[field] === null) {
            errors.push(`${field} is required`);
            continue;
        }
        const value = String(body[field]).trim();
        if (!value) {
            errors.push(`${field} cannot be empty`);
            continue;
        }
        normalized[field] = value;
    }

    if (errors.length) {
        return { errors };
    }

    if (!isValidHttpUrl(normalized.booking_url)) {
        return { errors: ['booking_url must be a valid http or https URL'] };
    }

    normalized.show_in_nav =
        body.show_in_nav === true || body.show_in_nav === false
            ? body.show_in_nav
            : true;

    return { book_page: normalized, errors: null };
}

async function updateBookPage(body) {
    const parsed = normalizeBookPageInput(body);
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const doc = await ensureSiteSettingsDoc();
    const book_page = {
        ...toBookPageStored(doc.book_page),
        ...parsed.book_page
    };

    const updated = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: { book_page } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { ok: true, settings: toBookPageAdminPayload(updated) };
}

function toBookPageStored(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};
    return {
        show_in_nav: base.show_in_nav !== false,
        booking_url: normalizeOptionalText(base.booking_url),
        page_title: normalizeOptionalText(base.page_title),
        body_text: normalizeOptionalText(base.body_text),
        button_label: normalizeOptionalText(base.button_label)
    };
}

function normalizeContactPageInput(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { errors: ['Request body is required'] };
    }

    const $set = {};

    if (body.contact_hero_image_url !== undefined) {
        const heroParsed = normalizeContactHeroImageUrl(body.contact_hero_image_url);
        if (heroParsed.errors) {
            errors.push(...heroParsed.errors);
        } else {
            $set.contact_hero_image_url = heroParsed.contact_hero_image_url;
        }
    }

    if (body.contact_hero_image_file_id !== undefined) {
        $set.contact_hero_image_file_id = normalizeOptionalText(body.contact_hero_image_file_id);
    }

    const contactPage = {};
    let hasContactPageFields = false;

    if (body.show_hero_image !== undefined) {
        contactPage.show_hero_image = Boolean(body.show_hero_image);
        hasContactPageFields = true;
    }

    if (body.show_in_nav !== undefined) {
        contactPage.show_in_nav =
            body.show_in_nav === true || body.show_in_nav === false
                ? body.show_in_nav
                : true;
        hasContactPageFields = true;
    }

    const textFields = [
        'page_title',
        'form_name_label',
        'form_email_label',
        'form_subject_label',
        'form_message_label',
        'form_submit_label',
        'success_message'
    ];

    for (const field of textFields) {
        if (body[field] !== undefined) {
            contactPage[field] = normalizeOptionalText(body[field]);
            hasContactPageFields = true;
        }
    }

    if (errors.length) {
        return { errors };
    }

    if (!Object.keys($set).length && !hasContactPageFields) {
        return { errors: ['No fields to update'] };
    }

    if (hasContactPageFields) {
        $set.contact_page = contactPage;
    }

    return { $set, partialContactPage: hasContactPageFields, errors: null };
}

function normalizeOptionalImageUrl(value, fieldName, errors) {
    if (value === undefined || value === null) {
        return '';
    }
    const url = String(value).trim();
    if (!url) {
        return '';
    }
    if (!isValidHttpUrl(url)) {
        errors.push(`${fieldName} must be a valid http or https URL`);
        return null;
    }
    return url;
}

function normalizeHeroImageUrlsInput(body, errors) {
    if (body.hero_image_urls !== undefined) {
        if (!Array.isArray(body.hero_image_urls)) {
            errors.push('hero_image_urls must be an array');
            return null;
        }

        const urls = [];
        for (let i = 0; i < body.hero_image_urls.length; i++) {
            const url = normalizeOptionalImageUrl(
                body.hero_image_urls[i],
                `hero_image_urls[${i}]`,
                errors
            );
            if (url === null) {
                return null;
            }
            if (url) {
                urls.push(url);
            }
        }
        return urls;
    }

    const hero_image_url = normalizeOptionalImageUrl(
        body.hero_image_url,
        'hero_image_url',
        errors
    );
    if (hero_image_url === null) {
        return null;
    }
    return hero_image_url ? [hero_image_url] : [];
}

function alignHeroMediaTypesToUrls(urls, rawTypes) {
    const types = Array.isArray(rawTypes) ? rawTypes.map((type) => normalizeHeroMediaType(type)) : [];
    return urls.map((url, index) => {
        if (types[index]) {
            return types[index];
        }
        return /\.(mp4|webm|mov)(\?|#|$)/i.test(String(url || '').trim()) ? 'video' : 'image';
    });
}

function normalizeHeroMediaTypesInput(body, hero_image_urls, errors) {
    if (body.hero_media_types !== undefined) {
        if (!Array.isArray(body.hero_media_types)) {
            errors.push('hero_media_types must be an array');
            return null;
        }

        const types = [];
        for (let i = 0; i < body.hero_media_types.length; i++) {
            const value = body.hero_media_types[i];
            if (value !== undefined && value !== null && typeof value !== 'string') {
                errors.push(`hero_media_types[${i}] must be a string`);
                return null;
            }
            types.push(normalizeHeroMediaType(value));
        }
        return alignHeroMediaTypesToUrls(hero_image_urls, types);
    }

    return resolveHeroMediaTypes(body, hero_image_urls);
}

function normalizeFileIdArrayInput(raw, fieldName, errors) {
    if (!Array.isArray(raw)) {
        errors.push(`${fieldName} must be an array`);
        return null;
    }
    const ids = [];
    for (let i = 0; i < raw.length; i++) {
        const value = raw[i];
        if (value !== undefined && value !== null && typeof value !== 'string') {
            errors.push(`${fieldName}[${i}] must be a string`);
            return null;
        }
        ids.push(normalizeOptionalText(value));
    }
    return ids;
}

function alignHeroFileIdsToUrls(urls, rawIds) {
    const ids = Array.isArray(rawIds) ? rawIds.map((id) => normalizeOptionalText(id)) : [];
    return urls.map((_, index) => ids[index] || '');
}

function normalizeHeroImageFileIdsInput(body, hero_image_urls, errors) {
    if (body.hero_image_file_ids !== undefined) {
        const ids = normalizeFileIdArrayInput(body.hero_image_file_ids, 'hero_image_file_ids', errors);
        if (ids === null) {
            return null;
        }
        return alignHeroFileIdsToUrls(hero_image_urls, ids);
    }

    if (body.hero_image_file_id !== undefined) {
        const single = normalizeOptionalText(body.hero_image_file_id);
        return hero_image_urls.map((_, index) => (index === 0 ? single : ''));
    }

    return hero_image_urls.map(() => '');
}

function normalizeOptionalText(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
}

function padFeaturedProductIds(raw) {
    const items = Array.isArray(raw) ? raw : [];
    const result = [];
    for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
        const row = items[i] && typeof items[i] === 'object' ? items[i] : {};
        const product_id =
            row.product_id != null
                ? String(row.product_id).trim()
                : row._id != null
                  ? String(row._id).trim()
                  : '';
        result.push({ product_id });
    }
    return result;
}

function emptyFeaturedCard() {
    return {
        product_id: '',
        slug: '',
        title: '',
        price: '',
        image_url: ''
    };
}

function productToFeaturedCard(product) {
    if (!product) {
        return emptyFeaturedCard();
    }
    return {
        product_id: String(product._id),
        slug: product.slug ? String(product.slug) : '',
        title: displayProductName(product),
        price: formatMoneyFromCents(product.price_cents, product.currency || 'usd'),
        image_url: primaryProductImageUrl(product) ?? ''
    };
}

async function resolveFeaturedProductCards(slots) {
    const ids = slots
        .map((s) => s.product_id)
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    let byId = new Map();
    if (ids.length) {
        const products = await applyProductRelations(
            Product.find({
                _id: { $in: ids },
                is_active: true,
                deleted_at: null
            })
        ).exec();
        byId = new Map(products.map((p) => [String(p._id), p]));
    }

    return slots.map((slot) => {
        if (!slot.product_id) {
            return emptyFeaturedCard();
        }
        const product = byId.get(slot.product_id);
        if (!product) {
            return { ...emptyFeaturedCard(), product_id: slot.product_id };
        }
        return productToFeaturedCard(product);
    });
}

function toAdminHomePagePayload(doc) {
    const base = doc.home_page || {};
    const hero_image_urls = resolveHeroImageUrls(base);
    const hero_image_url = hero_image_urls[0] || '';
    const hero_image_file_ids = resolveHeroImageFileIds(base);
    const hero_image_file_id = hero_image_file_ids[0] || '';
    const hero_media_types = resolveHeroMediaTypes(base, hero_image_urls);
    return {
        hero_title: normalizeOptionalText(base.hero_title),
        hero_subtitle: normalizeOptionalText(base.hero_subtitle),
        hero_image_url,
        hero_image_urls,
        hero_image_file_id,
        hero_image_file_ids,
        hero_media_types,
        hero_background_image_url: normalizeOptionalText(base.hero_background_image_url),
        hero_background_image_file_id: normalizeOptionalText(base.hero_background_image_file_id),
        featured_title: normalizeOptionalText(base.featured_title),
        featured_products: padFeaturedProductIds(base.featured_products),
        about_title: normalizeOptionalText(base.about_title),
        hero_quote: normalizeOptionalText(base.hero_quote),
        about_header: normalizeOptionalText(base.about_header),
        about_text: normalizeOptionalText(base.about_text),
        about_image_url: normalizeOptionalText(base.about_image_url),
        about_image_file_id: normalizeOptionalText(base.about_image_file_id),
        about_me_left_image_url: normalizeOptionalText(base.about_me_left_image_url),
        about_me_left_image_file_id: normalizeOptionalText(base.about_me_left_image_file_id),
        about_me_right_image_url: normalizeOptionalText(base.about_me_right_image_url),
        about_me_right_image_file_id: normalizeOptionalText(base.about_me_right_image_file_id),
        hero_lines_image_url: normalizeOptionalText(base.hero_lines_image_url),
        hero_lines_image_file_id: normalizeOptionalText(base.hero_lines_image_file_id),
        about_background_image_url: normalizeOptionalText(base.about_background_image_url),
        about_background_image_file_id: normalizeOptionalText(base.about_background_image_file_id)
    };
}

async function toPublicHomePagePayload(doc) {
    const base = doc.home_page || {};
    const text = mergeHomePageTextDefaults(base);
    const slots = padFeaturedProductIds(base.featured_products);
    const featured_products = await resolveFeaturedProductCards(slots);
    return { ...text, featured_products };
}

function normalizeHomePageInput(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { errors: ['Request body is required'] };
    }

    const hero_image_urls = normalizeHeroImageUrlsInput(body, errors);
    if (hero_image_urls === null) {
        return { errors };
    }
    const hero_image_url = hero_image_urls[0] || '';
    const hero_image_file_ids = normalizeHeroImageFileIdsInput(body, hero_image_urls, errors);
    if (hero_image_file_ids === null) {
        return { errors };
    }
    const hero_image_file_id = hero_image_file_ids[0] || '';
    const hero_media_types = normalizeHeroMediaTypesInput(body, hero_image_urls, errors);
    if (hero_media_types === null) {
        return { errors };
    }

    const about_image_url = normalizeOptionalImageUrl(
        body.about_image_url,
        'about_image_url',
        errors
    );
    if (about_image_url === null) {
        return { errors };
    }
    const about_image_file_id = normalizeOptionalText(body.about_image_file_id);

    const about_me_left_image_url = normalizeOptionalImageUrl(
        body.about_me_left_image_url,
        'about_me_left_image_url',
        errors
    );
    if (about_me_left_image_url === null) {
        return { errors };
    }
    const about_me_left_image_file_id = normalizeOptionalText(body.about_me_left_image_file_id);

    const about_me_right_image_url = normalizeOptionalImageUrl(
        body.about_me_right_image_url,
        'about_me_right_image_url',
        errors
    );
    if (about_me_right_image_url === null) {
        return { errors };
    }
    const about_me_right_image_file_id = normalizeOptionalText(body.about_me_right_image_file_id);

    const hero_lines_image_url = normalizeOptionalImageUrl(
        body.hero_lines_image_url,
        'hero_lines_image_url',
        errors
    );
    if (hero_lines_image_url === null) {
        return { errors };
    }
    const hero_lines_image_file_id = normalizeOptionalText(body.hero_lines_image_file_id);

    const hero_background_image_url = normalizeOptionalImageUrl(
        body.hero_background_image_url,
        'hero_background_image_url',
        errors
    );
    if (hero_background_image_url === null) {
        return { errors };
    }
    const hero_background_image_file_id = normalizeOptionalText(body.hero_background_image_file_id);

    const about_background_image_url = normalizeOptionalImageUrl(
        body.about_background_image_url,
        'about_background_image_url',
        errors
    );
    if (about_background_image_url === null) {
        return { errors };
    }
    const about_background_image_file_id = normalizeOptionalText(body.about_background_image_file_id);

    const featured_products = [];
    const rawFeatured = Array.isArray(body.featured_products) ? body.featured_products : [];
    const usedProductIds = new Set();
    for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
        const row = rawFeatured[i] && typeof rawFeatured[i] === 'object' ? rawFeatured[i] : {};
        const product_id = normalizeOptionalText(row.product_id);
        if (product_id) {
            if (!mongoose.Types.ObjectId.isValid(product_id)) {
                errors.push(`featured_products[${i}].product_id is invalid`);
            } else if (usedProductIds.has(product_id)) {
                errors.push(`featured_products[${i}]: each listing can only be featured once`);
            } else {
                usedProductIds.add(product_id);
            }
        }
        featured_products.push({ product_id });
    }

    if (errors.length) {
        return { errors };
    }

    return {
        home_page: {
            hero_title: normalizeOptionalText(body.hero_title),
            hero_subtitle: normalizeOptionalText(body.hero_subtitle),
            hero_image_url,
            hero_image_urls,
            hero_image_file_id,
            hero_image_file_ids,
            hero_media_types,
            featured_title: normalizeOptionalText(body.featured_title),
            featured_products,
            about_title: normalizeOptionalText(body.about_title),
            hero_quote: normalizeOptionalText(body.hero_quote),
            about_header: normalizeOptionalText(body.about_header),
            about_text: normalizeOptionalText(body.about_text),
            about_image_url,
            about_image_file_id,
            about_me_left_image_url,
            about_me_left_image_file_id,
            about_me_right_image_url,
            about_me_right_image_file_id,
            hero_lines_image_url,
            hero_lines_image_file_id,
            hero_background_image_url,
            hero_background_image_file_id,
            about_background_image_url,
            about_background_image_file_id
        }
    };
}

async function getAdminHomePage() {
    const doc = await ensureSiteSettingsDoc();
    return toAdminHomePagePayload(doc);
}

async function getPublicHomePage() {
    const doc = await ensureSiteSettingsDoc();
    return await toPublicHomePagePayload(doc);
}

async function updateHomePage(body) {
    const parsed = normalizeHomePageInput(body);
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const existing = await ensureSiteSettingsDoc();
    const previousIds = collectStoredHomePageFileIds(existing.home_page);
    const nextIds = collectParsedHomePageFileIds(parsed.home_page);
    const toDelete = fileIdsRemoved(previousIds, nextIds);

    const doc = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: { home_page: parsed.home_page } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (toDelete.length) {
        await deleteImageKitFilesBestEffort(toDelete);
    }

    return { ok: true, settings: toAdminHomePagePayload(doc) };
}

async function updateDisplayPictures(body) {
    const parsed = normalizeContactPageInput(body);
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const doc = await ensureSiteSettingsDoc();
    const previousIds = collectFileIdsFromValues(doc.contact_hero_image_file_id);
    const nextContactFileId =
        parsed.$set.contact_hero_image_file_id !== undefined
            ? parsed.$set.contact_hero_image_file_id
            : doc.contact_hero_image_file_id;
    const nextIds = collectFileIdsFromValues(nextContactFileId);
    const toDelete = fileIdsRemoved(previousIds, nextIds);

    const $set = { ...parsed.$set };

    if (parsed.partialContactPage && parsed.$set.contact_page) {
        $set.contact_page = {
            ...mergeContactPageStored(doc.contact_page),
            ...parsed.$set.contact_page
        };
    }

    const updated = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (toDelete.length) {
        await deleteImageKitFilesBestEffort(toDelete);
    }

    return { ok: true, settings: toContactPageAdminPayload(updated) };
}

async function updateSocialSettings(body) {
    const errors = [];
    const $set = {};

    if (body && body.social_links !== undefined) {
        const parsed = normalizeSocialLinksInput(body.social_links);
        if (parsed.errors) {
            errors.push(...parsed.errors);
        } else {
            $set.social_links = parsed.social_links;
        }
    }

    if (body && body.contact_email !== undefined) {
        const emailParsed = normalizeContactEmail(body.contact_email);
        if (emailParsed.errors) {
            errors.push(...emailParsed.errors);
        } else {
            $set.contact_email = emailParsed.contact_email;
        }
    }

    if (errors.length) {
        return { ok: false, status: 400, errors };
    }

    if (!Object.keys($set).length) {
        return { ok: false, status: 400, errors: ['No fields to update'] };
    }

    const doc = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { ok: true, settings: toAdminPayload(doc) };
}

module.exports = {
    getAdminSocialSettings,
    getPublicSocialLinks,
    getPublicContactEmail,
    getAdminSiteBranding,
    getPublicSiteBranding,
    updateSiteBranding,
    updateSocialSettings,
    getAdminDisplayPictures,
    getPublicContactHero,
    updateDisplayPictures,
    getAdminHomePage,
    getPublicHomePage,
    updateHomePage,
    getAdminBookPage,
    getPublicBookPage,
    getPublicNavVisibility,
    updateBookPage,
    ensureSiteSettingsDoc,
    FEATURED_PRODUCT_SLOTS,
    emptyFeaturedProduct
};
