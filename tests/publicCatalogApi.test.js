jest.mock('../server/ai/igGenerationGraph', () => ({
    runIgGeneration: jest.fn().mockResolvedValue({ finalOutput: null, validationErrors: null }),
    igGenerationGraph: {},
    setModelForTesting: jest.fn()
}));

const request = require('supertest');
const { createApp } = require('../server/app');
const { ProductImage } = require('../server/db');
const { startTestDatabase, stopTestDatabase, clearDatabase } = require('./helpers/mongo');
const { createTestProduct } = require('./helpers/factories');

const app = createApp();

async function createProductWithImages(overrides = {}, images = []) {
    const product = await createTestProduct(overrides);
    if (images.length) {
        await ProductImage.insertMany(
            images.map((img, index) => ({
                product_id: product._id,
                image_url: img.image_url,
                image_provider_id: img.image_provider_id || null,
                alt_text: img.alt_text || null,
                sort_order: img.sort_order != null ? img.sort_order : index,
                is_primary: Boolean(img.is_primary),
                is_active: true,
                deleted_at: null
            }))
        );
    }
    return product;
}

describe('public catalog API', () => {
    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(() => stopTestDatabase());

    beforeEach(() => clearDatabase());

    it('returns slim list items with primary image only', async () => {
        const product = await createProductWithImages(
            {
                title: 'Harbor Light',
                slug: 'harbor-light',
                description: 'A long description that must not appear in the list payload.',
                price_cents: 4500,
                stripe_product_id: 'prod_secret',
                stripe_price_id: 'price_secret',
                size_label: '16x20',
                format: 'Giclée',
                year_created: 2024
            },
            [
                {
                    image_url: 'https://ik.imagekit.io/demo/secondary.jpg',
                    image_provider_id: 'file_secondary',
                    is_primary: false,
                    sort_order: 1,
                    alt_text: 'Secondary'
                },
                {
                    image_url: 'https://ik.imagekit.io/demo/primary.jpg',
                    image_provider_id: 'file_primary',
                    is_primary: true,
                    sort_order: 0,
                    alt_text: 'Primary'
                }
            ]
        );

        const res = await request(app).get('/api/products');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);

        const item = res.body[0];
        expect(item._id).toBe(String(product._id));
        expect(item.id).toBe(String(product._id));
        expect(item.slug).toBe('harbor-light');
        expect(item.title).toBe('Harbor Light');
        expect(item.price_cents).toBe(4500);
        expect(item.currency).toBe('usd');
        expect(item.is_active).toBe(true);
        expect(item.created_at).toBeTruthy();

        expect(item.description).toBeUndefined();
        expect(item.quantity_available).toBeUndefined();
        expect(item.size_label).toBeUndefined();
        expect(item.format).toBeUndefined();
        expect(item.year_created).toBeUndefined();
        expect(item.stripe_product_id).toBeUndefined();
        expect(item.stripe_price_id).toBeUndefined();
        expect(item.deleted_at).toBeUndefined();

        expect(item.product_images).toHaveLength(1);
        expect(item.product_images[0].image_url).toBe('https://ik.imagekit.io/demo/primary.jpg');
        expect(item.product_images[0].alt_text).toBe('Primary');
        expect(item.product_images[0].is_primary).toBe(true);
        expect(item.product_images[0].image_provider_id).toBeUndefined();
    });

    it('returns full public detail by slug without Stripe internals', async () => {
        await createProductWithImages(
            {
                title: 'Harbor Light',
                slug: 'harbor-light',
                description: 'Full detail description.',
                price_cents: 4500,
                stripe_product_id: 'prod_secret',
                stripe_price_id: 'price_secret',
                size_label: '16x20',
                format: 'Giclée',
                year_created: 2024
            },
            [
                {
                    image_url: 'https://ik.imagekit.io/demo/primary.jpg',
                    image_provider_id: 'file_primary',
                    is_primary: true,
                    sort_order: 0
                },
                {
                    image_url: 'https://ik.imagekit.io/demo/secondary.jpg',
                    image_provider_id: 'file_secondary',
                    is_primary: false,
                    sort_order: 1
                }
            ]
        );

        const res = await request(app).get('/api/product/harbor-light');
        expect(res.status).toBe(200);
        expect(res.body.slug).toBe('harbor-light');
        expect(res.body.description).toBe('Full detail description.');
        expect(res.body.format).toBeUndefined();
        expect(res.body.year_created).toBeUndefined();
        expect(res.body.size_label).toBeUndefined();
        expect(res.body.quantity_available).toBeUndefined();
        expect(res.body.product_images).toHaveLength(1);
        expect(res.body.product_images[0].image_url).toBe('https://ik.imagekit.io/demo/primary.jpg');
        expect(res.body.stripe_product_id).toBeUndefined();
        expect(res.body.stripe_price_id).toBeUndefined();
        expect(res.body.deleted_at).toBeUndefined();
        expect(res.body.product_images[0].image_provider_id).toBeUndefined();
    });

    it('excludes inactive and soft-deleted products from the public list', async () => {
        await createTestProduct({ slug: 'active-piece', is_active: true, deleted_at: null });
        await createTestProduct({ slug: 'inactive-piece', is_active: false, deleted_at: null });
        await createTestProduct({
            slug: 'deleted-piece',
            is_active: true,
            deleted_at: new Date()
        });

        const res = await request(app).get('/api/products');
        expect(res.status).toBe(200);
        expect(res.body.map((p) => p.slug)).toEqual(['active-piece']);
    });

    it('returns 404 for missing public product slug', async () => {
        const res = await request(app).get('/api/product/does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Product not found');
    });
});
