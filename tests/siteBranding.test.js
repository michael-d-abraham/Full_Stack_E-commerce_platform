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
const { DEFAULT_SITE_NAME } = require('../shared/siteBrandDefaults');

const app = createApp();
const ADMIN = { username: 'brand-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';
const LOGO_URL = 'https://example.com/logo.png';

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

describe('site branding API', () => {
    beforeAll(() => startTestDatabase());
    afterAll(() => stopTestDatabase());

    it('GET /api/site/site-branding defaults to PERM text mode', async () => {
        const res = await request(app).get('/api/site/site-branding');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            site_name: DEFAULT_SITE_NAME,
            site_name_mode: 'text',
            site_name_logo_url: ''
        });
    });

    it('admin can save and public endpoint resolves custom site name', async () => {
        await createAdmin();
        const login = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        const cookie = sidCookie(login);

        const save = await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: 'Basquiat Gallery',
                site_name_mode: 'text',
                site_name_logo_url: ''
            });

        expect(save.status).toBe(200);
        expect(save.body).toEqual({
            site_name: 'Basquiat Gallery',
            site_name_mode: 'text',
            site_name_logo_url: ''
        });

        const publicRes = await request(app).get('/api/site/site-branding');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toEqual({
            site_name: 'Basquiat Gallery',
            site_name_mode: 'text',
            site_name_logo_url: ''
        });
    });

    it('admin can save logo branding and public endpoint returns image mode', async () => {
        const login = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        const cookie = sidCookie(login);

        const save = await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: 'Basquiat',
                site_name_mode: 'image',
                site_name_logo_url: LOGO_URL
            });

        expect(save.status).toBe(200);
        expect(save.body).toEqual({
            site_name: 'Basquiat',
            site_name_mode: 'image',
            site_name_logo_url: LOGO_URL
        });

        const publicRes = await request(app).get('/api/site/site-branding');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toEqual({
            site_name: 'Basquiat',
            site_name_mode: 'image',
            site_name_logo_url: LOGO_URL
        });
    });

    it('clearing site name restores default on public endpoint', async () => {
        const login = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        const cookie = sidCookie(login);

        await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: '',
                site_name_mode: 'text',
                site_name_logo_url: ''
            });

        const publicRes = await request(app).get('/api/site/site-branding');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toEqual({
            site_name: DEFAULT_SITE_NAME,
            site_name_mode: 'text',
            site_name_logo_url: ''
        });
    });
});
