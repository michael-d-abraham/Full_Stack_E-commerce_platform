/**
 * Verifies admin hero_image_urls flow against a running dev server (port 3000).
 * Mirrors AdminHomePage.vue console logs and acceptance criteria.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { resolveHeroImageUrls, FEATURED_PRODUCT_SLOTS } from '../shared/homePageDefaults.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const BASE = process.env.VERIFY_API_BASE || 'http://localhost:3000';
const USER = process.env.ADMIN_MASTER_USERNAME || process.env.ADMIN_USERNAME;
const PASS = process.env.ADMIN_MASTER_PASSWORD || process.env.ADMIN_PASSWORD;
const FIXTURE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../tests/fixtures/test-hero.jpg');

function emptyFeaturedProducts() {
    return Array.from({ length: FEATURED_PRODUCT_SLOTS }, () => ({ product_id: '' }));
}

function payloadFromForm(hero_image_urls, formExtras = {}) {
    const urls = hero_image_urls.map((url) => String(url).trim()).filter(Boolean);
    return {
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: urls[0] || '',
        hero_image_urls: urls,
        featured_title: '',
        featured_products: emptyFeaturedProducts(),
        about_title: '',
        hero_quote: '',
        about_header: '',
        about_text: '',
        about_image_url: '',
        ...formExtras
    };
}

function parseSidCookie(res) {
    const raw = res.headers.get('set-cookie') || '';
    const match = raw.match(/connect\.sid=([^;]+)/);
    return match ? `connect.sid=${match[1]}` : null;
}

async function login() {
    const res = await fetch(`${BASE}/api/admin/session/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: USER, plainPassword: PASS })
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Login failed (${res.status}): ${body}`);
    }
    const cookie = parseSidCookie(res);
    if (!cookie) throw new Error('Login succeeded but no session cookie returned');
    return cookie;
}

async function uploadImage(cookie) {
    const buf = fs.readFileSync(FIXTURE);
    const form = new FormData();
    form.append('image', new Blob([buf], { type: 'image/jpeg' }), 'test-hero.jpg');
    const res = await fetch(`${BASE}/api/admin/upload-image`, {
        method: 'POST',
        headers: { Cookie: cookie },
        body: form
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Upload failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return data;
}

async function putHomePage(cookie, hero_image_urls) {
    const payload = payloadFromForm(hero_image_urls);
    console.log('[AdminHomePage] form.hero_image_urls before save', [...hero_image_urls]);
    console.log('[AdminHomePage] PUT payload hero_image_urls', payload.hero_image_urls);

    const res = await fetch(`${BASE}/api/admin/site/home-page`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`PUT failed (${res.status}): ${JSON.stringify(data)}`);
    }

    console.log('[AdminHomePage] PUT response hero_image_urls', data?.hero_image_urls);
    if (data?.hero_image_urls === undefined) {
        throw new Error('PUT response missing hero_image_urls');
    }

    const applied = resolveHeroImageUrls(data);
    console.log('[AdminHomePage] form.hero_image_urls after applySettings', applied);
    return { response: data, applied };
}

async function getAdminHomePage(cookie) {
    const res = await fetch(`${BASE}/api/admin/site/home-page`, {
        headers: { Cookie: cookie }
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(`GET failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return data;
}

function assertTwoUrls(label, urls) {
    if (!Array.isArray(urls) || urls.length !== 2) {
        throw new Error(`${label}: expected 2 URLs, got ${JSON.stringify(urls)}`);
    }
    if (!urls.every((u) => typeof u === 'string' && u.startsWith('http'))) {
        throw new Error(`${label}: invalid URL entries ${JSON.stringify(urls)}`);
    }
}

async function main() {
    if (!USER || !PASS) {
        throw new Error('Set ADMIN_MASTER_USERNAME/PASSWORD or ADMIN_USERNAME/PASSWORD in .env');
    }

    console.log('--- Admin hero_image_urls verification ---');
    const cookie = await login();

    // Start clean
    await putHomePage(cookie, []);

    const first = await uploadImage(cookie);
    console.log('[AdminHomePage] upload response image_url', first.image_url);
    let hero_image_urls = [first.image_url];
    await putHomePage(cookie, hero_image_urls);

    const second = await uploadImage(cookie);
    console.log('[AdminHomePage] upload response image_url', second.image_url);
    hero_image_urls = [...hero_image_urls, second.image_url];

    const { response: putRes, applied } = await putHomePage(cookie, hero_image_urls);
    assertTwoUrls('PUT response', putRes.hero_image_urls);
    assertTwoUrls('after applySettings', applied);
    if (putRes.hero_image_url !== putRes.hero_image_urls[0]) {
        throw new Error('hero_image_url does not match hero_image_urls[0]');
    }

    const reload = await getAdminHomePage(cookie);
    const reloaded = resolveHeroImageUrls(reload);
    console.log('[AdminHomePage] GET admin after reload hero_image_urls', reloaded);
    assertTwoUrls('GET admin reload', reloaded);

    console.log('PASS: add second image, PUT payload/response 2 URLs, reload shows 2 URLs');
    console.log('Session cookie for UI check:', cookie);
}

main().catch((err) => {
    console.error('FAIL:', err.message);
    process.exit(1);
});
