// Mock the LangGraph pipeline so Jest never tries to parse @langchain/langgraph's
// ESM-only uuid dependency. None of these tests exercise the generation pipeline.
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
const mockImageKitUpload = ImageKit.__mockUpload;
const { createApp } = require('../server/app');
const { AdminUser } = require('../server/db');
const { startTestDatabase, stopTestDatabase } = require('./helpers/mongo');
const { hashPassword } = require('../server/utils/adminPassword');
const { assertProductionConfig, REQUIRED_PRODUCTION_ENV } = require('../server/sessionConfig');
const { detectImageMime, validateImageBuffer } = require('../server/utils/imageMime');
const {
    uploadImageToImageKit,
    normalizeUploadFolder
} = require('../server/services/imageKitStorageService');

const app = createApp();

const ADMIN = { username: 'sec-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';

function sidCookie(res) {
    const cookies = res.headers['set-cookie'] || [];
    const found = cookies.find((c) => c.startsWith('connect.sid='));
    return found ? found.split(';')[0] : null;
}

async function createAdmin(overrides = {}) {
    return AdminUser.create({
        username: ADMIN.username,
        passwordHash: hashPassword(ADMIN.password),
        enabled: true,
        isAdmin: true,
        ...overrides
    });
}

describe('assertProductionConfig (production env validation)', () => {
    it('does nothing outside production even when secrets are missing', () => {
        expect(() => assertProductionConfig({ NODE_ENV: 'development' })).not.toThrow();
        expect(() => assertProductionConfig({})).not.toThrow();
    });

    it('throws in production when a required secret is missing', () => {
        const env = {
            NODE_ENV: 'production',
            STRIPE_SECRET_KEY: 'sk_test_x',
            STRIPE_WEBHOOK_SECRET: 'whsec_x',
            MONGO_STRING: 'mongodb://localhost:27017'
            // SESSION_SECRET intentionally omitted
        };
        expect(() => assertProductionConfig(env)).toThrow(/SESSION_SECRET/);
    });

    it('passes in production when all required secrets are present', () => {
        const env = { NODE_ENV: 'production' };
        REQUIRED_PRODUCTION_ENV.forEach((key) => {
            env[key] = 'set';
        });
        expect(() => assertProductionConfig(env)).not.toThrow();
    });
});

describe('upload image content validation (magic bytes)', () => {
    const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const GIF = Buffer.from('GIF89a-----extra', 'ascii');
    const WEBP = Buffer.concat([
        Buffer.from('RIFF', 'ascii'),
        Buffer.from([0, 0, 0, 0]),
        Buffer.from('WEBP', 'ascii')
    ]);

    it('detects supported image types from their signatures', () => {
        expect(detectImageMime(PNG)).toBe('image/png');
        expect(detectImageMime(JPEG)).toBe('image/jpeg');
        expect(detectImageMime(GIF)).toBe('image/gif');
        expect(detectImageMime(WEBP)).toBe('image/webp');
    });

    it('detects SVG from XML content', () => {
        const SVG = Buffer.from(
            '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
            'utf8'
        );
        expect(detectImageMime(SVG)).toBe('image/svg+xml');
    });

    it('returns null for non-image content', () => {
        expect(detectImageMime(Buffer.from('<html>not an image</html>'))).toBeNull();
        expect(detectImageMime(Buffer.from('GIF', 'ascii'))).toBeNull();
    });

    it('rejects a file whose bytes are not a real image even if MIME claims image/png', () => {
        expect(() =>
            validateImageBuffer(Buffer.from('this is plain text, not a PNG'), 'image/png')
        ).toThrow(expect.objectContaining({ code: 'INVALID_IMAGE' }));
    });

    it('accepts SVG when bytes match image/svg+xml', () => {
        const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8');
        expect(validateImageBuffer(SVG, 'image/svg+xml')).toBe('image/svg+xml');
    });

    it('accepts image/jpg as an alias for JPEG', () => {
        expect(validateImageBuffer(JPEG, 'image/jpg')).toBe('image/jpeg');
    });

    it('rejects a disallowed claimed MIME type', () => {
        expect(() => validateImageBuffer(PNG, 'application/pdf')).toThrow(
            expect.objectContaining({ code: 'INVALID_IMAGE' })
        );
    });
});

describe('ImageKit upload service', () => {
    const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

    const savedEnv = {};

    beforeEach(() => {
        mockImageKitUpload.mockReset();
        mockImageKitUpload.mockResolvedValue({
            url: 'https://ik.imagekit.io/demo/products/test.png',
            fileId: 'file_abc123',
            name: 'test.png',
            filePath: '/products/test.png',
            thumbnailUrl: 'https://ik.imagekit.io/demo/tr:n-300/products/test.png',
            width: 800,
            height: 600,
            size: 2048
        });

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

    it('normalizes allowed upload folders', () => {
        expect(normalizeUploadFolder(undefined)).toBe('products');
        expect(normalizeUploadFolder('site/hero/')).toBe('site/hero');
        expect(normalizeUploadFolder('/site/logo')).toBe('site/logo');
    });

    it('rejects unknown upload folders', () => {
        expect(() => normalizeUploadFolder('other/path')).toThrow(
            expect.objectContaining({ code: 'INVALID_FOLDER' })
        );
    });

    it('uploads to ImageKit and returns normalized metadata', async () => {
        const result = await uploadImageToImageKit({
            buffer: PNG,
            mimeType: 'image/png',
            originalName: 'photo.png',
            folder: 'site/about'
        });

        expect(mockImageKitUpload).toHaveBeenCalledWith(
            expect.objectContaining({
                fileName: expect.stringMatching(/\.png$/),
                folder: '/site/about'
            })
        );
        expect(result).toMatchObject({
            url: 'https://ik.imagekit.io/demo/products/test.png',
            fileId: 'file_abc123',
            name: 'test.png',
            filePath: '/products/test.png',
            thumbnailUrl: 'https://ik.imagekit.io/demo/tr:n-300/products/test.png',
            width: 800,
            height: 600,
            size: 2048
        });
    });

    it('rejects invalid image bytes before calling ImageKit', async () => {
        await expect(
            uploadImageToImageKit({
                buffer: Buffer.from('not an image'),
                mimeType: 'image/png',
                originalName: 'bad.png'
            })
        ).rejects.toMatchObject({ code: 'INVALID_IMAGE' });

        expect(mockImageKitUpload).not.toHaveBeenCalled();
    });
});

describe('admin upload-image folder routing', () => {
    const VALID_PNG = Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
        'hex'
    );

    const savedEnv = {};

    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await AdminUser.deleteMany({});
        mockImageKitUpload.mockReset();
        mockImageKitUpload.mockImplementation(async (params) => ({
            url: `https://ik.imagekit.io/demo${params.folder}/test.png`,
            fileId: 'file_test',
            name: 'test.png',
            filePath: `${params.folder}/test.png`,
            thumbnailUrl: null,
            width: 1,
            height: 1,
            size: 100
        }));

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

    it.each([
        ['products', '/products'],
        ['site/hero', '/site/hero'],
        ['site/hero-background', '/site/hero-background'],
        ['site/about-background', '/site/about-background'],
        ['site/about', '/site/about'],
        ['site/about-me', '/site/about-me'],
        ['site/contact', '/site/contact'],
        ['site/logo', '/site/logo']
    ])('POST /api/admin/upload-image passes folder %s', async (folder, imageKitFolder) => {
        await createAdmin();
        const agent = request.agent(app);
        const login = await agent
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        expect(login.status).toBe(200);

        const res = await agent
            .post('/api/admin/upload-image')
            .field('folder', folder)
            .attach('image', VALID_PNG, {
                filename: 'test.png',
                contentType: 'image/png'
            });

        expect(res.status).toBe(200);
        expect(res.body.image_url).toBeTruthy();
        expect(res.body.file_id).toBe('file_test');
        expect(mockImageKitUpload).toHaveBeenCalledWith(
            expect.objectContaining({ folder: imageKitFolder })
        );
    });

    it('POST /api/admin/upload-image accepts transparent SVG for background folders', async () => {
        const SVG = Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="50" height="50" fill="red" opacity="0.5"/></svg>',
            'utf8'
        );
        await createAdmin();
        const agent = request.agent(app);
        const login = await agent
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        expect(login.status).toBe(200);

        const res = await agent
            .post('/api/admin/upload-image')
            .field('folder', 'site/hero-background')
            .attach('image', SVG, {
                filename: 'texture.svg',
                contentType: 'image/svg+xml'
            });

        expect(res.status).toBe(200);
        expect(res.body.image_url).toBeTruthy();
        expect(mockImageKitUpload).toHaveBeenCalledWith(
            expect.objectContaining({
                folder: '/site/hero-background',
                fileName: expect.stringMatching(/\.svg$/)
            })
        );
    });
});

describe('admin auth (login / logout / session)', () => {
    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await AdminUser.deleteMany({});
    });

    it('logs in with correct credentials and issues a session cookie', async () => {
        await createAdmin();
        const res = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ ok: true, username: ADMIN.username });
        expect(sidCookie(res)).toBeTruthy();
    });

    it('rejects a wrong password with a generic message', async () => {
        await createAdmin();
        const res = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: 'wrong-password' });

        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/not correct/i);
    });

    it('does not reveal that an account is disabled (same generic message)', async () => {
        await createAdmin({ enabled: false });

        const wrongRes = await request(app)
            .post(LOGIN_PATH)
            .send({ username: 'nope', plainPassword: 'whatever' });
        const disabledRes = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });

        expect(disabledRes.status).toBe(401);
        expect(disabledRes.body.error).toBe(wrongRes.body.error);
        expect(disabledRes.body.error).not.toMatch(/disabled/i);
    });

    it('returns 422 when fields are missing', async () => {
        const res = await request(app).post(LOGIN_PATH).send({ username: 'only-user' });
        expect(res.status).toBe(422);
    });

    it('regenerates the session id on login (anti session-fixation)', async () => {
        await createAdmin();
        const agent = request.agent(app);

        const pre = await agent
            .put('/api/cart')
            .send({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }] });
        const preSid = sidCookie(pre);
        expect(preSid).toBeTruthy();

        const loginRes = await agent
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        const postSid = sidCookie(loginRes);

        expect(loginRes.status).toBe(200);
        expect(postSid).toBeTruthy();
        expect(postSid).not.toBe(preSid);
    });

    it('logout clears the session cookie', async () => {
        await createAdmin();
        const agent = request.agent(app);
        await agent
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });

        const res = await agent.post('/api/admin/session/logout');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        const cleared = (res.headers['set-cookie'] || []).find((c) => c.startsWith('connect.sid='));
        expect(cleared).toMatch(/connect\.sid=;|Expires=Thu, 01 Jan 1970/);
    });
});

describe('admin authorization matrix', () => {
    const protectedRoutes = [
        '/api/admin/products',
        '/api/admin/orders',
        '/api/admin/dashboard',
        '/api/admin/site',
        '/api/admin/ai/voice-profile',
        '/api/admin/upload-image'
    ];

    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await AdminUser.deleteMany({});
    });

    it.each(protectedRoutes)('GET %s returns 401 without a session', async (route) => {
        const res = await request(app).get(route);
        expect(res.status).toBe(401);
    });

    it.each(protectedRoutes)(
        'GET %s returns 403 for an authenticated non-admin user',
        async (route) => {
            await createAdmin({ isAdmin: false });
            const agent = request.agent(app);
            const login = await agent
                .post(LOGIN_PATH)
                .send({ username: ADMIN.username, plainPassword: ADMIN.password });
            expect(login.status).toBe(200);

            const res = await agent.get(route);
            expect(res.status).toBe(403);
        }
    );
});

describe('rate limiting', () => {
    beforeAll(async () => {
        await startTestDatabase();
        process.env.ENABLE_RATE_LIMIT = '1';
    });

    afterAll(async () => {
        delete process.env.ENABLE_RATE_LIMIT;
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await AdminUser.deleteMany({});
    });

    it('locks out repeated failed admin logins with 429', async () => {
        await createAdmin();

        let lastStatus;
        for (let i = 0; i < 11; i++) {
            const res = await request(app)
                .post(LOGIN_PATH)
                .send({ username: ADMIN.username, plainPassword: 'wrong-password' });
            lastStatus = res.status;
        }
        expect(lastStatus).toBe(429);
    });

    it('throttles the public contact form with 429 after the cap', async () => {
        let lastRes;
        for (let i = 0; i < 6; i++) {
            lastRes = await request(app)
                .post('/api/contact')
                .send({ name: 'A', email: 'a@b.com', subject: 'Hi', message: 'Hello there' });
        }
        expect(lastRes.status).toBe(429);
        expect(lastRes.body.success).toBe(false);
    });
});

describe('security headers', () => {
    // Uses an unauthenticated admin route (401, no DB access) so the assertion
    // does not depend on a live database connection.
    it('sets X-Content-Type-Options: nosniff via helmet', async () => {
        const res = await request(app).get('/api/admin/products');
        expect(res.status).toBe(401);
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('allows storefront image CDNs in CSP img-src', async () => {
        const res = await request(app).get('/api/admin/products');
        const csp = res.headers['content-security-policy'] || '';
        expect(csp).toMatch(/img-src[^;]*https:\/\/static\.wixstatic\.com/);
        expect(csp).toMatch(/img-src[^;]*\bhttps:/);
    });
});
