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
const { DEFAULT_SITE_NAME, BRAND_DISPLAY_TEXT, BRAND_DISPLAY_IMAGE } = require('../shared/siteBrandDefaults');

const app = createApp();
const ADMIN = { username: 'brand-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';
const LOGO_URL = 'https://cdn.example.com/site-logo.png';

function sidCookie(res) {
    const cookies = res.headers['set-cookie'] || [];
    const found = cookies.find((c) => c.startsWith('connect.sid='));
    return found ? found.split(';')[0] : null;
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

describe('site branding API', () => {
    beforeAll(() => startTestDatabase());
    afterAll(() => stopTestDatabase());

    it('GET /api/site/site-branding defaults to PERM text mode', async () => {
        const res = await request(app).get('/api/site/site-branding');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            site_name: DEFAULT_SITE_NAME,
            brand_display_mode: BRAND_DISPLAY_TEXT,
            site_logo_url: ''
        });
    });

    it('admin can save and public endpoint resolves custom site name', async () => {
        await createAdmin();
        const cookie = await adminCookie();

        const save = await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: 'Basquiat Gallery',
                brand_display_mode: BRAND_DISPLAY_TEXT,
                site_logo_url: ''
            });

        expect(save.status).toBe(200);
        expect(save.body).toEqual({
            site_name: 'Basquiat Gallery',
            brand_display_mode: BRAND_DISPLAY_TEXT,
            site_logo_url: ''
        });

        const publicRes = await request(app).get('/api/site/site-branding');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toEqual({
            site_name: 'Basquiat Gallery',
            brand_display_mode: BRAND_DISPLAY_TEXT,
            site_logo_url: ''
        });
    });

    it('admin can save logo image branding', async () => {
        const cookie = await adminCookie();

        const save = await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: 'Studio Mark',
                brand_display_mode: BRAND_DISPLAY_IMAGE,
                site_logo_url: LOGO_URL
            });

        expect(save.status).toBe(200);
        expect(save.body).toEqual({
            site_name: 'Studio Mark',
            brand_display_mode: BRAND_DISPLAY_IMAGE,
            site_logo_url: LOGO_URL
        });

        const publicRes = await request(app).get('/api/site/site-branding');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toEqual({
            site_name: 'Studio Mark',
            brand_display_mode: BRAND_DISPLAY_IMAGE,
            site_logo_url: LOGO_URL
        });
    });

    it('rejects image mode without a logo URL', async () => {
        const cookie = await adminCookie();

        const save = await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: 'Studio Mark',
                brand_display_mode: BRAND_DISPLAY_IMAGE,
                site_logo_url: ''
            });

        expect(save.status).toBe(400);
        expect(save.body.errors[0]).toMatch(/site_logo_url/i);
    });

    it('clearing site name restores default on public endpoint', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: '',
                brand_display_mode: BRAND_DISPLAY_TEXT,
                site_logo_url: ''
            });

        const publicRes = await request(app).get('/api/site/site-branding');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toEqual({
            site_name: DEFAULT_SITE_NAME,
            brand_display_mode: BRAND_DISPLAY_TEXT,
            site_logo_url: ''
        });
    });
});
