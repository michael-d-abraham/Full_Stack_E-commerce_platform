const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema(
    {
        url: { type: String, required: true, default: '' },
        enabled: { type: Boolean, required: true, default: true }
    },
    { _id: false }
);

const homeFeaturedProductSchema = new mongoose.Schema(
    {
        product_id: { type: String, default: '' }
    },
    { _id: false }
);

const homePageSchema = new mongoose.Schema(
    {
        hero_title: { type: String, default: '' },
        hero_subtitle: { type: String, default: '' },
        hero_image_url: { type: String, default: '' },
        featured_title: { type: String, default: '' },
        featured_products: { type: [homeFeaturedProductSchema], default: () => [] },
        about_title: { type: String, default: '' },
        about_header: { type: String, default: '' },
        about_text: { type: String, default: '' },
        about_image_url: { type: String, default: '' }
    },
    { _id: false }
);

const contactPageSchema = new mongoose.Schema(
    {
        show_hero_image: { type: Boolean, default: true },
        page_title: { type: String, default: '' },
        form_name_label: { type: String, default: '' },
        form_email_label: { type: String, default: '' },
        form_subject_label: { type: String, default: '' },
        form_message_label: { type: String, default: '' },
        form_submit_label: { type: String, default: '' },
        success_message: { type: String, default: '' }
    },
    { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: 'default' },
        social_links: {
            youtube: { type: socialLinkSchema, default: () => ({}) },
            instagram: { type: socialLinkSchema, default: () => ({}) },
            tiktok: { type: socialLinkSchema, default: () => ({}) },
            facebook: { type: socialLinkSchema, default: () => ({}) }
        },
        contact_hero_image_url: { type: String, default: '' },
        contact_page: { type: contactPageSchema, default: () => ({}) },
        contact_email: { type: String, default: '' },
        home_page: { type: homePageSchema, default: () => ({}) }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'site_settings'
    }
);

module.exports =
    mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
