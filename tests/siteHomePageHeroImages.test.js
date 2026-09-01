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
const ADMIN = { username: 'home-hero-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';

const URL_ONE = 'https://example.com/a.jpg';
const URL_TWO = 'https://example.com/b.jpg';

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

describe('home page hero_image_urls API', () => {
    beforeAll(async () => {
        await startTestDatabase();
        await createAdmin();
    });
    afterAll(() => stopTestDatabase());

    it('GET /api/admin/site/home-page returns hero_image_urls', async () => {
        const cookie = await adminCookie();

        const res = await request(app)
            .get('/api/admin/site/home-page')
            .set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('hero_image_urls');
        expect(Array.isArray(res.body.hero_image_urls)).toBe(true);
        expect(res.body.hero_image_urls).toEqual([]);
        expect(res.body.hero_image_url).toBe('');
        expect(res.body.hero_image_file_ids).toEqual([]);
        expect(res.body.about_image_file_id).toBe('');
    });

    it('PUT then GET admin and public return matching hero_image_urls', async () => {
        const cookie = await adminCookie();

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_ONE, URL_TWO]
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.hero_image_url).toBe(URL_ONE);
        expect(putRes.body.hero_image_urls).toEqual([URL_ONE, URL_TWO]);

        const adminGetRes = await request(app)
            .get('/api/admin/site/home-page')
            .set('Cookie', cookie);

        expect(adminGetRes.status).toBe(200);
        expect(adminGetRes.body.hero_image_url).toBe(URL_ONE);
        expect(adminGetRes.body.hero_image_urls).toEqual([URL_ONE, URL_TWO]);

        const publicGetRes = await request(app).get('/api/site/home-page');

        expect(publicGetRes.status).toBe(200);
        expect(publicGetRes.body.hero_image_url).toBe(URL_ONE);
        expect(publicGetRes.body.hero_image_urls).toEqual([URL_ONE, URL_TWO]);
    });

    it('PUT /api/admin/site/home-page returns hero_image_urls from hero_image_urls input', async () => {
        const cookie = await adminCookie();

        const res = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_ONE, URL_TWO]
                })
            );

        expect(res.status).toBe(200);
        expect(res.body.hero_image_urls).toEqual([URL_ONE, URL_TWO]);
        expect(res.body.hero_image_url).toBe(URL_ONE);
    });

    it('GET /api/site/home-page returns hero_image_urls after save', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_ONE, URL_TWO]
                })
            );

        const res = await request(app).get('/api/site/home-page');

        expect(res.status).toBe(200);
        expect(res.body.hero_image_urls).toEqual([URL_ONE, URL_TWO]);
        expect(res.body.hero_image_url).toBe(URL_ONE);
    });

    it('PUT with only hero_image_url stores and returns hero_image_urls as a single-item array', async () => {
        const cookie = await adminCookie();

        const res = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_url: URL_ONE
                })
            );

        expect(res.status).toBe(200);
        expect(res.body.hero_image_urls).toEqual([URL_ONE]);
        expect(res.body.hero_image_url).toBe(URL_ONE);
    });

    it('PUT stores hero_quote and about_header independently', async () => {
        const cookie = await adminCookie();

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_quote: 'Hero quote only',
                    about_header: 'About quote only'
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.hero_quote).toBe('Hero quote only');
        expect(putRes.body.about_header).toBe('About quote only');

        const publicGetRes = await request(app).get('/api/site/home-page');

        expect(publicGetRes.status).toBe(200);
        expect(publicGetRes.body.hero_quote).toBe('Hero quote only');
        expect(publicGetRes.body.about_header).toBe('About quote only');
    });

    it('admin GET returns hero_quote without copying about_header', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    about_header: 'About quote only'
                })
            );

        const adminGetRes = await request(app)
            .get('/api/admin/site/home-page')
            .set('Cookie', cookie);

        expect(adminGetRes.status).toBe(200);
        expect(adminGetRes.body.about_header).toBe('About quote only');
        expect(adminGetRes.body.hero_quote).toBe('');
    });

    it('rejects invalid URLs in hero_image_urls', async () => {
        const cookie = await adminCookie();

        const res = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_ONE, 'not-a-url']
                })
            );

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining([
                'hero_image_urls[1] must be a valid http or https URL'
            ])
        );
    });

    it('PUT and GET persist hero_media_types aligned to hero_image_urls', async () => {
        const cookie = await adminCookie();
        const videoUrl = 'https://example.com/hero.mp4';

        const putRes = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [videoUrl, URL_ONE],
                    hero_media_types: ['video', 'image']
                })
            );

        expect(putRes.status).toBe(200);
        expect(putRes.body.hero_media_types).toEqual(['video', 'image']);

        const publicGetRes = await request(app).get('/api/site/home-page');
        expect(publicGetRes.status).toBe(200);
        expect(publicGetRes.body.hero_media_types).toEqual(['video', 'image']);
    });
});
