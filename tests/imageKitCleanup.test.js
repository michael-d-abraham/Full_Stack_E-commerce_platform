jest.mock('../server/ai/igGenerationGraph', () => ({
    runIgGeneration: jest.fn().mockResolvedValue({ finalOutput: null, validationErrors: null }),
    igGenerationGraph: {},
    setModelForTesting: jest.fn()
}));

jest.mock('@imagekit/nodejs', () => {
    const mockUpload = jest.fn();
    const mockDelete = jest.fn().mockResolvedValue(undefined);
    const ImageKit = jest.fn().mockImplementation(() => ({
        files: { upload: mockUpload, delete: mockDelete }
    }));
    ImageKit.toFile = jest.fn(async (buffer, name) => ({ buffer, name }));
    ImageKit.__mockUpload = mockUpload;
    ImageKit.__mockDelete = mockDelete;
    return ImageKit;
});

const request = require('supertest');
const ImageKit = require('@imagekit/nodejs');
const mockImageKitDelete = ImageKit.__mockDelete;
const { createApp } = require('../server/app');
const { AdminUser, Product, ProductImage, OrderItem } = require('../server/db');
const { startTestDatabase, stopTestDatabase, clearDatabase } = require('./helpers/mongo');
const { hashPassword } = require('../server/utils/adminPassword');
const { FEATURED_PRODUCT_SLOTS } = require('../shared/homePageDefaults');
const {
    deleteImageFromImageKit,
    deleteImageKitFilesBestEffort
} = require('../server/services/imageKitStorageService');

const app = createApp();
const ADMIN = { username: 'cleanup-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';

const R2_URL = 'https://assets.example.com/products/legacy.jpg';
const URL_A = 'https://ik.imagekit.io/demo/a.jpg';
const URL_B = 'https://ik.imagekit.io/demo/b.jpg';
const FILE_A = 'file_product_a';
const FILE_B = 'file_product_b';
const FILE_LEGACY = 'file_legacy_hero';
const FILE_NEW = 'file_new_hero';

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
        title: 'Cleanup test piece',
        description: 'Test listing',
        price_cents: 5000,
        quantity_available: 1,
        currency: 'usd',
        ...overrides
    };
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

function contactBody(overrides = {}) {
    return {
        contact_hero_image_url: '',
        contact_hero_image_file_id: '',
        show_hero_image: true,
        page_title: 'Contact',
        form_name_label: 'Name',
        form_email_label: 'Email',
        form_subject_label: 'Subject',
        form_message_label: 'Message',
        form_submit_label: 'Send',
        success_message: 'Thanks',
        show_in_nav: true,
        ...overrides
    };
}

describe('ImageKit cleanup on replace/remove', () => {
    const savedEnv = {};

    beforeAll(async () => {
        await startTestDatabase();
        await createAdmin();
    });

    afterAll(() => stopTestDatabase());

    beforeEach(async () => {
        await clearDatabase();
        mockImageKitDelete.mockClear();
        mockImageKitDelete.mockResolvedValue(undefined);

        for (const key of ['IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_URL_ENDPOINT']) {
            savedEnv[key] = process.env[key];
            process.env[key] = 'test-value';
        }
    });

    afterEach(() => {
        for (const key of Object.keys(savedEnv)) {
            if (savedEnv[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = savedEnv[key];
            }
        }
    });

    it('replacing a product image deletes the old ImageKit file ID', async () => {
        const cookie = await adminCookie();

        const created = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [{ image_url: URL_A, image_provider_id: FILE_A, is_primary: true }]
                })
            );

        const productId = created.body._id;
        mockImageKitDelete.mockClear();

        const updated = await request(app)
            .put(`/api/admin/products/${productId}`)
            .set('Cookie', cookie)
            .send({
                images: [{ image_url: URL_B, image_provider_id: FILE_B, is_primary: true }]
            });

        expect(updated.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledTimes(1);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_A);
        expect(mockImageKitDelete).not.toHaveBeenCalledWith(FILE_B);
    });

    it('removing a product image deletes the removed file ID', async () => {
        const cookie = await adminCookie();

        const created = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [
                        { image_url: URL_A, image_provider_id: FILE_A, is_primary: true },
                        { image_url: URL_B, image_provider_id: FILE_B, is_primary: false }
                    ]
                })
            );

        mockImageKitDelete.mockClear();

        const updated = await request(app)
            .put(`/api/admin/products/${created.body._id}`)
            .set('Cookie', cookie)
            .send({
                images: [{ image_url: URL_A, image_provider_id: FILE_A, is_primary: true }]
            });

        expect(updated.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledTimes(1);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_B);
    });

    it('re-saving unchanged product images does not delete ImageKit files', async () => {
        const cookie = await adminCookie();

        const created = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [{ image_url: URL_A, image_provider_id: FILE_A, is_primary: true }]
                })
            );

        mockImageKitDelete.mockClear();

        const updated = await request(app)
            .put(`/api/admin/products/${created.body._id}`)
            .set('Cookie', cookie)
            .send({
                images: [{ image_url: URL_A, image_provider_id: FILE_A, is_primary: true }]
            });

        expect(updated.status).toBe(200);
        expect(mockImageKitDelete).not.toHaveBeenCalled();
    });

    it('URL-only legacy product images never trigger ImageKit delete', async () => {
        const cookie = await adminCookie();

        const created = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [{ image_url: R2_URL, is_primary: true }]
                })
            );

        mockImageKitDelete.mockClear();

        const updated = await request(app)
            .put(`/api/admin/products/${created.body._id}`)
            .set('Cookie', cookie)
            .send({
                images: []
            });

        expect(updated.status).toBe(200);
        expect(mockImageKitDelete).not.toHaveBeenCalled();
    });

    it('deleting a product deletes ImageKit files for active images with file IDs', async () => {
        const cookie = await adminCookie();

        const created = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [{ image_url: URL_A, image_provider_id: FILE_A, is_primary: true }]
                })
            );

        mockImageKitDelete.mockClear();

        const deleted = await request(app)
            .delete(`/api/admin/products/${created.body._id}`)
            .set('Cookie', cookie);

        expect(deleted.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_A);

        const images = await ProductImage.find({ product_id: created.body._id }).lean();
        expect(images.every((row) => row.deleted_at != null)).toBe(true);
    });

    it('replacing hero image deletes the old hero file ID', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_A],
                    hero_image_file_ids: [FILE_LEGACY]
                })
            );

        mockImageKitDelete.mockClear();

        const updated = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_B],
                    hero_image_file_ids: [FILE_NEW]
                })
            );

        expect(updated.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_LEGACY);
        expect(mockImageKitDelete).not.toHaveBeenCalledWith(FILE_NEW);
    });

    it('removing hero image deletes the removed hero file ID', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_A, URL_B],
                    hero_image_file_ids: [FILE_A, FILE_B]
                })
            );

        mockImageKitDelete.mockClear();

        const updated = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_A],
                    hero_image_file_ids: [FILE_A]
                })
            );

        expect(updated.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_B);
    });

    it('reordering hero images does not delete any file IDs', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_A, URL_B],
                    hero_image_file_ids: [FILE_A, FILE_B]
                })
            );

        mockImageKitDelete.mockClear();

        const updated = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_B, URL_A],
                    hero_image_file_ids: [FILE_B, FILE_A]
                })
            );

        expect(updated.status).toBe(200);
        expect(mockImageKitDelete).not.toHaveBeenCalled();
    });

    it('replacing about/contact/logo images deletes old file IDs', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    about_image_url: URL_A,
                    about_image_file_id: FILE_A
                })
            );

        mockImageKitDelete.mockClear();

        const aboutUpdate = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    about_image_url: URL_B,
                    about_image_file_id: FILE_B
                })
            );

        expect(aboutUpdate.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_A);

        mockImageKitDelete.mockClear();

        await request(app)
            .put('/api/admin/site/display-pictures')
            .set('Cookie', cookie)
            .send(contactBody({ contact_hero_image_url: URL_A, contact_hero_image_file_id: FILE_A }));

        mockImageKitDelete.mockClear();

        const contactUpdate = await request(app)
            .put('/api/admin/site/display-pictures')
            .set('Cookie', cookie)
            .send(contactBody({ contact_hero_image_url: URL_B, contact_hero_image_file_id: FILE_B }));

        expect(contactUpdate.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_A);

        mockImageKitDelete.mockClear();

        await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: 'Gallery',
                site_name_mode: 'image',
                site_name_logo_url: URL_A,
                site_name_logo_file_id: FILE_A
            });

        mockImageKitDelete.mockClear();

        const logoUpdate = await request(app)
            .put('/api/admin/site/site-branding')
            .set('Cookie', cookie)
            .send({
                site_name: 'Gallery',
                site_name_mode: 'image',
                site_name_logo_url: URL_B,
                site_name_logo_file_id: FILE_B
            });

        expect(logoUpdate.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_A);
    });

    it('clearing about/contact/logo deletes the previous file ID', async () => {
        const cookie = await adminCookie();

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    about_image_url: URL_A,
                    about_image_file_id: FILE_A
                })
            );

        mockImageKitDelete.mockClear();

        const aboutClear = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(homePageBody({ about_image_url: '', about_image_file_id: '' }));

        expect(aboutClear.status).toBe(200);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_A);
    });

    it('delete failure logs but does not fail save', async () => {
        const cookie = await adminCookie();
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_A],
                    hero_image_file_ids: [FILE_LEGACY]
                })
            );

        mockImageKitDelete.mockRejectedValueOnce(new Error('ImageKit unavailable'));

        const updated = await request(app)
            .put('/api/admin/site/home-page')
            .set('Cookie', cookie)
            .send(
                homePageBody({
                    hero_image_urls: [URL_B],
                    hero_image_file_ids: [FILE_NEW]
                })
            );

        expect(updated.status).toBe(200);
        expect(updated.body.hero_image_file_ids).toEqual([FILE_NEW]);
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('product image updates do not modify order item snapshots', async () => {
        const cookie = await adminCookie();

        const created = await request(app)
            .post('/api/admin/products')
            .set('Cookie', cookie)
            .send(
                productBody({
                    images: [{ image_url: URL_A, image_provider_id: FILE_A, is_primary: true }]
                })
            );

        await OrderItem.create({
            order_id: created.body._id,
            product_id: created.body._id,
            product_title: 'Snapshot',
            product_slug: 'snapshot',
            image_url: URL_A,
            unit_price_cents: 5000,
            quantity: 1,
            line_total_cents: 5000
        });

        await request(app)
            .put(`/api/admin/products/${created.body._id}`)
            .set('Cookie', cookie)
            .send({
                images: [{ image_url: URL_B, image_provider_id: FILE_B, is_primary: true }]
            });

        const orderItem = await OrderItem.findOne({ product_id: created.body._id }).lean();
        expect(orderItem.image_url).toBe(URL_A);
    });

    it('deleteImageFromImageKit skips empty file IDs', async () => {
        const result = await deleteImageFromImageKit('');
        expect(result).toEqual({ ok: true, skipped: true });
        expect(mockImageKitDelete).not.toHaveBeenCalled();
    });

    it('deleteImageKitFilesBestEffort dedupes file IDs', async () => {
        mockImageKitDelete.mockClear();
        await deleteImageKitFilesBestEffort([FILE_A, FILE_A, FILE_B]);
        expect(mockImageKitDelete).toHaveBeenCalledTimes(2);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_A);
        expect(mockImageKitDelete).toHaveBeenCalledWith(FILE_B);
    });
});
