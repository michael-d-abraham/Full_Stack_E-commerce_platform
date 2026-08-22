jest.mock('../server/ai/igGenerationGraph', () => ({
    runIgGeneration: jest.fn().mockResolvedValue({ finalOutput: null, validationErrors: null }),
    igGenerationGraph: {},
    setModelForTesting: jest.fn()
}));

const request = require('supertest');
const { createApp } = require('../server/app');
const { AdminUser } = require('../server/db');
const { startTestDatabase, stopTestDatabase } = require('./helpers/mongo');
const { hashPassword } = require('../server/utils/adminPassword');
const { FEATURED_PRODUCT_SLOTS } = require('../shared/homePageDefaults');

const app = createApp();
const ADMIN = { username: 'file-id-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';

const HERO_URL_ONE = 'https://example.com/hero-one.jpg';
const HERO_URL_TWO = 'https://example.com/hero-two.jpg';
const ABOUT_URL = 'https://example.com/about.jpg';
const CONTACT_URL = 'https://example.com/contact.jpg';
const LOGO_URL = 'https://example.com/logo.png';
const HERO_FILE_ONE = 'file_hero_one';
const HERO_FILE_TWO = 'file_hero_two';
const ABOUT_FILE = 'file_about';
const CONTACT_FILE = 'file_contact';
const LOGO_FILE = 'file_logo';

function sidCookie(res) {
    const cookies = res.headers['set-cookie'] || [];
    const found = cookies.find((c) => c.startsWith('connect.sid='));
    return found ? found.split(';')[0] : null;
}

function emptyFeaturedProducts() {
    return Array.from({ length: FEATURED_PRODUCT_SLOTS }, () => ({ product_id: '' }));
}

function homePageBody(overrides = {}) {
    return {
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: '',
        featured_title: '',
        featured_products: emptyFeaturedProducts(),
        about_title: '',
        hero_quote: '',
        about_header: '',
        about_text: '',
        about_image_url: '',
        ...overrides
    };
}

async function createAdmin() {
    return AdminUser.create({
        username: ADMIN.username,
        passwordHash: hashPassword(ADMIN.password),
        enabled: true,
        isAdmin: true
    });
}

async function adminCookie() {
    const login = await request(app)
        .post(LOGIN_PATH)
        .send({ username: ADMIN.username, plainPassword: ADMIN.password });
    return sidCookie(login);
}

describe('site settings image file ID persistence', () => {
    beforeAll(async () => {
        await startTestDatabase();
        await createAdmin();
    });

    afterAll(() => stopTestDatabase());

    it('admin home page returns empty file ID fields by default', async () => {
        const cookie = await adminCookie();
        const res = await request(app)
            .get('/api/admin/site/home-page')
            .set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.hero_image_file_id).toBe('');
        expect(res.body.hero_image_file_ids).toEqual([]);
        expect(res.body.about_image_file_id).toBe('');
        expect(res.body.about_me_left_image_file_id).toBe('');
        expect(res.body.about_me_right_image_file_id).toBe('');
        expect(res.body.hero_background_image_file_id).toBe('');
        expect(res.body.about_background_image_file_id).toBe('');
        expect(res.body.featured_background_image_file_id).toBeUndefined();
    });

    it('saves about background texture file IDs on home page', async () => {
        const cookie = await adminCookie();
        const ABOUT_BG_URL = 'https://example.com/about-bg.webp';
        const ABOUT_BG_FILE = 'file_about_bg';

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    about_background_image_url: ABOUT_BG_URL,
                    about_background_image_file_id: ABOUT_BG_FILE
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.about_background_image_url).toBe(ABOUT_BG_URL);
        expect(putRes.body.about_background_image_file_id).toBe(ABOUT_BG_FILE);
        expect(putRes.body.featured_background_image_url).toBeUndefined();
        expect(putRes.body.featured_background_image_file_id).toBeUndefined();

        const publicRes = await request(app).get('/api/site/home-page');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.about_background_image_url).toBe(ABOUT_BG_URL);
        expect(publicRes.body.featured_background_image_url).toBeUndefined();
        expect(publicRes.body.about_background_image_file_id).toBeUndefined();
    });

    it('saves hero background texture file ID on home page', async () => {
        const cookie = await adminCookie();
        const BG_URL = 'https://example.com/hero-bg.webp';
        const BG_FILE = 'file_hero_bg';

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_background_image_url: BG_URL,
                    hero_background_image_file_id: BG_FILE
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.hero_background_image_url).toBe(BG_URL);
        expect(putRes.body.hero_background_image_file_id).toBe(BG_FILE);

        const publicRes = await request(app).get('/api/site/home-page');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.hero_background_image_url).toBe(BG_URL);
        expect(publicRes.body.hero_background_image_file_id).toBeUndefined();
    });

    it('saves hero and about image file IDs on home page', async () => {
        const cookie = await adminCookie();

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [HERO_URL_ONE, HERO_URL_TWO],
                    hero_image_file_ids: [HERO_FILE_ONE, HERO_FILE_TWO],
                    about_image_url: ABOUT_URL,
                    about_image_file_id: ABOUT_FILE
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.hero_image_file_ids).toEqual([HERO_FILE_ONE, HERO_FILE_TWO]);
        expect(putRes.body.hero_image_file_id).toBe(HERO_FILE_ONE);
        expect(putRes.body.about_image_file_id).toBe(ABOUT_FILE);

        const getRes = await request(app)
            .get('/api/admin/site/home-page')
            .set('Cookie', cookie);

        expect(getRes.body.hero_image_file_ids).toEqual([HERO_FILE_ONE, HERO_FILE_TWO]);
        expect(getRes.body.about_image_file_id).toBe(ABOUT_FILE);
    });

    it('public home page does not expose image file IDs', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [HERO_URL_ONE],
                    hero_image_file_ids: [HERO_FILE_ONE],
                    about_image_url: ABOUT_URL,
                    about_image_file_id: ABOUT_FILE
                })
            );

        const publicRes = await request(app).get('/api/site/home-page');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.hero_image_urls).toEqual([HERO_URL_ONE]);
        expect(publicRes.body.about_image_url).toBe(ABOUT_URL);
        expect(publicRes.body.hero_image_file_ids).toBeUndefined();
        expect(publicRes.body.about_image_file_id).toBeUndefined();
    });

    it('saves about me pair images and hides file IDs publicly', async () => {
        const cookie = await adminCookie();
        const LEFT_URL = 'https://example.com/about-me-left.jpg';
        const RIGHT_URL = 'https://example.com/about-me-right.jpg';
        const LEFT_FILE = 'file_about_me_left';
        const RIGHT_FILE = 'file_about_me_right';

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    about_me_left_image_url: LEFT_URL,
                    about_me_left_image_file_id: LEFT_FILE,
                    about_me_right_image_url: RIGHT_URL,
                    about_me_right_image_file_id: RIGHT_FILE
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.about_me_left_image_url).toBe(LEFT_URL);
        expect(putRes.body.about_me_left_image_file_id).toBe(LEFT_FILE);
        expect(putRes.body.about_me_right_image_url).toBe(RIGHT_URL);
        expect(putRes.body.about_me_right_image_file_id).toBe(RIGHT_FILE);

        const publicRes = await request(app).get('/api/site/home-page');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.about_me_left_image_url).toBe(LEFT_URL);
        expect(publicRes.body.about_me_right_image_url).toBe(RIGHT_URL);
        expect(publicRes.body.about_me_left_image_file_id).toBeUndefined();
        expect(publicRes.body.about_me_right_image_file_id).toBeUndefined();
    });

    it('saves the .lines hero photo separately from the madd photo', async () => {
        const cookie = await adminCookie();
        const LINES_URL = 'https://example.com/hero-lines.jpg';
        const LINES_FILE = 'file_hero_lines';

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_url: HERO_URL_ONE,
                    hero_image_file_id: HERO_FILE_ONE,
                    hero_lines_image_url: LINES_URL,
                    hero_lines_image_file_id: LINES_FILE
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.hero_image_url).toBe(HERO_URL_ONE);
        expect(putRes.body.hero_lines_image_url).toBe(LINES_URL);
        expect(putRes.body.hero_lines_image_file_id).toBe(LINES_FILE);

        const publicRes = await request(app).get('/api/site/home-page');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.hero_image_url).toBe(HERO_URL_ONE);
        expect(publicRes.body.hero_lines_image_url).toBe(LINES_URL);
        expect(publicRes.body.hero_lines_image_file_id).toBeUndefined();
    });

    it('URL-only home page save still works without file IDs', async () => {
        const cookie = await adminCookie();

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [HERO_URL_ONE]
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.hero_image_urls).toEqual([HERO_URL_ONE]);
        expect(putRes.body.hero_image_file_ids).toEqual(['']);
        expect(putRes.body.about_image_file_id).toBe('');
    });

    it('saves contact portrait file ID on display pictures', async () => {
        const cookie = await adminCookie();

        const putRes = await request(app)
            .put('/api/admin/site/display-pictures')
            .set('Cookie', cookie)
            .send({
                contact_hero_image_url: CONTACT_URL,
                contact_hero_image_file_id: CONTACT_FILE,
                show_hero_image: true,
                page_title: 'Contact',
                form_name_label: 'Name',
                form_email_label: 'Email',
                form_subject_label: 'Subject',
                form_message_label: 'Message',
                form_submit_label: 'Send',
                success_message: 'Thanks',
                show_in_nav: true
            });

        expect(putRes.status).toBe(200);
        expect(putRes.body.contact_hero_image_file_id).toBe(CONTACT_FILE);

        const publicRes = await request(app).get('/api/site/contact-hero');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.image_url).toBe(CONTACT_URL);
        expect(publicRes.body.contact_hero_image_file_id).toBeUndefined();
    });

    it('saves site logo file ID on branding', async () => {
        const cookie = await adminCookie();

        const putRes = await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: 'Gallery',
                site_name_mode: 'image',
                site_name_logo_url: LOGO_URL,
                site_name_logo_file_id: LOGO_FILE
            });

        expect(putRes.status).toBe(200);
        expect(putRes.body.site_name_logo_file_id).toBe(LOGO_FILE);

        const publicRes = await request(app).get('/api/site/site-branding');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body.site_name_logo_url).toBe(LOGO_URL);
        expect(publicRes.body.site_name_logo_file_id).toBeUndefined();
    });
});
