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
const { DEFAULT_BOOK_PAGE } = require('../shared/bookPageDefaults');

const app = createApp();
const ADMIN = { username: 'book-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';

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

describe('book page site settings API', () => {
    beforeAll(() => startTestDatabase());
    afterAll(() => stopTestDatabase());

    it('GET /api/site/book-page returns merged defaults', async () => {
        const res = await request(app).get('/api/site/book-page');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.body).toEqual(DEFAULT_BOOK_PAGE);
    });

    it('GET/PUT /api/admin/site/book-page reads and saves settings', async () => {
        await createAdmin();
        const login = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        const cookie = sidCookie(login);
        expect(cookie).toBeTruthy();

        const getRes = await request(app)
            .get('/api/admin/site/book-page')
            .set('Cookie', cookie);
        expect(getRes.status).toBe(200);
        expect(getRes.body.page_title).toBe('');

        const payload = {
            show_in_nav: false,
            booking_url: 'https://example.com/book',
            page_title: 'Book a session',
            body_text: 'Use the button below to schedule.',
            button_label: 'Schedule'
        };

        const putRes = await request(app)
            .put('/api/admin/site/book-page')
            .set('Cookie', cookie)
            .send(payload);
        expect(putRes.status).toBe(200);
        expect(putRes.body).toMatchObject(payload);

        const publicRes = await request(app).get('/api/site/book-page');
        expect(publicRes.status).toBe(200);
        expect(publicRes.body).toMatchObject({ ...payload, show_in_nav: false });
    });
});
