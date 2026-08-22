jest.mock('../server/ai/igGenerationGraph', () => ({
    runIgGeneration: jest.fn().mockResolvedValue({ finalOutput: null, validationErrors: null }),
    igGenerationGraph: {},
    setModelForTesting: jest.fn()
}));

const request = require('supertest');
const { createApp } = require('../server/app');
const { AdminUser, Product, ProductImage } = require('../server/db');
const { startTestDatabase, stopTestDatabase, clearDatabase } = require('./helpers/mongo');
const { hashPassword } = require('../server/utils/adminPassword');

const app = createApp();
const ADMIN = { username: 'product-img-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';

const R2_URL = 'https://assets.example.com/products/legacy.jpg';
const IMAGEKIT_URL = 'https://ik.imagekit.io/demo/products/new.jpg';
const FILE_ID = 'file_product_abc123';

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

function productBody(overrides = {}) {
    return {
        label: 'Fine line',
        title: 'Test piece',
        description: 'A test listing',
        price_cents: 10000,
        quantity_available: 1,
        currency: 'usd',
        ...overrides
    };
}

describe('product image image_provider_id persistence', () => {
    beforeAll(async () => {
        await startTestDatabase();
        await createAdmin();
    });

    afterAll(() => stopTestDatabase());

    beforeEach(() => clearDatabase());

    it('saves image_provider_id when creating a product with images', async () => {
        const cookie = await adminCookie();

        const res = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [
                        {
                            image_url: IMAGEKIT_URL,
                            image_provider_id: FILE_ID,
                            is_primary: true
                        }
                    ]
                })
            );

        expect(res.status).toBe(201);
        const productId = res.body._id;
        const images = await ProductImage.find({ product_id: productId, deleted_at: null }).lean();
        expect(images).toHaveLength(1);
        expect(images[0].image_url).toBe(IMAGEKIT_URL);
        expect(images[0].image_provider_id).toBe(FILE_ID);
    });

    it('creates product images without image_provider_id for legacy R2 URLs', async () => {
        const cookie = await adminCookie();

        const res = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [{ image_url: R2_URL, is_primary: true }]
                })
            );

        expect(res.status).toBe(201);
        const images = await ProductImage.find({
            product_id: res.body._id,
            deleted_at: null
        }).lean();
        expect(images[0].image_provider_id).toBeNull();
    });

    it('syncs image_provider_id on product update', async () => {
        const cookie = await adminCookie();

        const created = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [{ image_url: R2_URL, is_primary: true }]
                })
            );

        const productId = created.body._id;

        const updated = await request(app)
            .put(`/api/admin/products/${productId}`)
            .set('Cookie', cookie)
            .send({
                images: [
                    {
                        image_url: IMAGEKIT_URL,
                        image_provider_id: FILE_ID,
                        is_primary: true
                    }
                ]
            });

        expect(updated.status).toBe(200);
        const images = await ProductImage.find({ product_id: productId, deleted_at: null }).lean();
        expect(images).toHaveLength(1);
        expect(images[0].image_provider_id).toBe(FILE_ID);
    });

    it('rejects non-string image_provider_id', async () => {
        const cookie = await adminCookie();

        const res = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [
                        {
                            image_url: IMAGEKIT_URL,
                            image_provider_id: 12345,
                            is_primary: true
                        }
                    ]
                })
            );

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
            expect.arrayContaining(['images[0].image_provider_id must be a string or null'])
        );
        const count = await Product.countDocuments({});
        expect(count).toBe(0);
    });
});
