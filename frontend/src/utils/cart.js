import { getCartSession, putCartSession } from '../services/api.js';
import { clampCartQuantity } from '@shared/cartQuantity.js';
import {
    displayProductName,
    primaryProductImageUrl
} from './storefrontProduct.js';

const CART_KEY = 'artist-portfolio-cart';

function readCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function notifyCartUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cart-updated'));
    }
}

/** Server session only needs ids + quantities (+ slug). */
function toServerCartLines(items) {
    return items.map((line) => ({
        productId: line.productId,
        slug: line.slug || '',
        quantity: line.quantity
    }));
}

function syncCartToServer(items) {
    putCartSession(toServerCartLines(items)).catch(() => {
        /* offline or session unavailable — local cart still works */
    });
}

function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    syncCartToServer(items);
    notifyCartUpdated();
}

function displaySnapshotFromProduct(product) {
    return {
        title: displayProductName(product) || product?.title || product?.slug || 'Product',
        priceCents: typeof product?.price_cents === 'number' ? product.price_cents : 0,
        imageUrl: primaryProductImageUrl(product) || '',
        sizeLabel: product?.size_label || ''
    };
}

function mergeSnapshot(line, product) {
    const snap = displaySnapshotFromProduct(product);
    return {
        ...line,
        slug: product.slug || line.slug || '',
        title: snap.title,
        priceCents: snap.priceCents,
        imageUrl: snap.imageUrl,
        sizeLabel: snap.sizeLabel
    };
}

/**
 * Restore cart from server session when local storage is empty (new device / cleared storage).
 */
export async function hydrateCartFromServer() {
    if (readCart().length) {
        syncCartToServer(readCart());
        return;
    }

    try {
        const data = await getCartSession();
        const items = Array.isArray(data.items) ? data.items : [];
        if (items.length) {
            localStorage.setItem(CART_KEY, JSON.stringify(items));
            notifyCartUpdated();
        }
    } catch {
        /* ignore */
    }
}

/**
 * Cart lines store productId + quantity + display snapshot for instant drawer UI.
 * Prices at Stripe checkout are still loaded server-side.
 */
export function addToCart(product) {
    if (!product || !product._id) {
        return { ok: false, reason: 'invalid' };
    }
    const q = product.quantity_available;
    if (typeof q === 'number' && q <= 0) {
        return { ok: false, reason: 'out_of_stock' };
    }

    const cart = readCart();
    const id = String(product._id);
    const existing = cart.find((line) => line.productId === id);
    if (existing) {
        existing.quantity += 1;
        Object.assign(existing, mergeSnapshot(existing, product));
    } else {
        cart.push({
            productId: id,
            slug: product.slug || '',
            quantity: 1,
            ...displaySnapshotFromProduct(product)
        });
    }
    writeCart(cart);
    return { ok: true };
}

/** Replace cart with a single item (e.g. Buy now on product page). */
export function setBuyNowCart(product, quantity = 1) {
    if (!product || !product._id) {
        return { ok: false, reason: 'invalid' };
    }
    const qty = clampCartQuantity(quantity);
    writeCart([
        {
            productId: String(product._id),
            slug: product.slug || '',
            quantity: qty,
            ...displaySnapshotFromProduct(product)
        }
    ]);
    return { ok: true };
}

export function getCart() {
    return readCart();
}

export function setCartQuantity(productId, quantity) {
    const cart = readCart();
    const line = cart.find((i) => i.productId === String(productId));
    if (!line) return;
    const next = clampCartQuantity(quantity);
    line.quantity = next;
    writeCart(cart);
}

export function removeFromCart(productId) {
    writeCart(readCart().filter((i) => i.productId !== String(productId)));
}

export function clearCart() {
    writeCart([]);
}

/** Payload for POST /api/create-checkout-session — ids and quantities only. */
export function getCheckoutItems() {
    return readCart().map((line) => ({
        product_id: line.productId,
        quantity: line.quantity
    }));
}
