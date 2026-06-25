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

const app = createApp();
const ADMIN = { username: 'nav-admin', password: 'correct horse battery staple' };
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

describe('site nav visibility API', () => {
    beforeAll(() => startTestDatabase());
    afterAll(() => stopTestDatabase());

    it('GET /api/site/nav-visibility defaults both tabs to visible', async () => {
        const res = await request(app).get('/api/site/nav-visibility');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ contact: true, book: true });
    });

    it('reflects saved contact and book show_in_nav settings', async () => {
        await createAdmin();
        const login = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        const cookie = sidCookie(login);

        await request(app)
            .put('/api/admin/site/display-pictures')
            .set('Cookie', cookie)
            .send({
                show_in_nav: false,
                show_hero_image: true,
                page_title: 'Contact',
                form_name_label: 'Name',
                form_email_label: 'Email',
                form_subject_label: 'Subject',
                form_message_label: 'Message',
                form_submit_label: 'Submit',
                success_message: 'Sent'
            });

        await request(app)
            .put('/api/admin/site/book-page')
            .set('Cookie', cookie)
            .send({
                show_in_nav: true,
                booking_url: 'https://example.com/book',
                page_title: 'Book',
                body_text: 'Schedule online.',
                button_label: 'Book now'
            });

        const res = await request(app).get('/api/site/nav-visibility');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ contact: false, book: true });
    });
});
