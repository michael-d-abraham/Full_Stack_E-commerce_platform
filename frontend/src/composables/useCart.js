import { ref, computed } from 'vue';
import {
    getCart,
    setCartQuantity,
    removeFromCart
} from '../utils/cart.js';
import {
    displayProductName,
    primaryProductImageUrl
} from '../utils/storefrontProduct.js';
import {
    ensureProductsList,
    getCachedProductsList
} from './useProductCache.js';

const ENRICHMENT_KEY = 'artist-portfolio-cart-enrichment';

const drawerOpen = ref(false);
const promoExpanded = ref(false);
const cartVersion = ref(0);
const productsById = ref(new Map());
let productsLoaded = false;

function bumpCart() {
    cartVersion.value += 1;
}

function onCartUpdated() {
    bumpCart();
}

if (typeof window !== 'undefined') {
    window.addEventListener('cart-updated', onCartUpdated);
}

function readEnrichmentMap() {
    if (typeof sessionStorage === 'undefined') {
        return new Map();
    }
    try {
        const raw = sessionStorage.getItem(ENRICHMENT_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== 'object') {
            return new Map();
        }
        return new Map(Object.entries(parsed));
    } catch {
        return new Map();
    }
}

function writeEnrichmentMap(map) {
    if (typeof sessionStorage === 'undefined') {
        return;
    }
    try {
        const obj = Object.fromEntries(map.entries());
        sessionStorage.setItem(ENRICHMENT_KEY, JSON.stringify(obj));
    } catch {
        /* ignore */
    }
}

function applyProductList(list) {
    const map = new Map();
    (Array.isArray(list) ? list : []).forEach((p) => map.set(String(p._id), p));
    productsById.value = map;
    writeEnrichmentMap(map);
    productsLoaded = true;
}

// Hydrate enrichment from session + product list cache immediately.
(() => {
    const cachedList = getCachedProductsList();
    if (Array.isArray(cachedList) && cachedList.length) {
        applyProductList(cachedList);
        return;
    }
    const fromSession = readEnrichmentMap();
    if (fromSession.size) {
        productsById.value = fromSession;
    }
})();

async function ensureProducts() {
    try {
        const list = await ensureProductsList();
        applyProductList(list);
    } catch {
        if (!productsLoaded) {
            productsById.value = productsById.value.size ? productsById.value : new Map();
        }
    }
}

export function useCart() {
    const rawLines = computed(() => {
        cartVersion.value;
        return getCart();
    });

    const items = computed(() => {
        return rawLines.value.map((line) => {
            const product = productsById.value.get(line.productId);
            if (product) {
                return {
                    id: line.productId,
                    name: displayProductName(product),
                    priceCents: product.price_cents ?? line.priceCents ?? 0,
                    imageUrl: primaryProductImageUrl(product) || line.imageUrl || '',
                    optionLabel: product.size_label || line.sizeLabel || '',
                    quantity: line.quantity
                };
            }
            // Optimistic snapshot — never drop lines while catalog hydrates.
            return {
                id: line.productId,
                name: line.title || line.slug || 'Product',
                priceCents: line.priceCents ?? 0,
                imageUrl: line.imageUrl || '',
                optionLabel: line.sizeLabel || '',
                quantity: line.quantity
            };
        });
    });

    const itemCount = computed(() =>
        rawLines.value.reduce((sum, line) => sum + line.quantity, 0)
    );

    const estimatedTotalCents = computed(() =>
        items.value.reduce((sum, line) => sum + line.priceCents * line.quantity, 0)
    );

    const isEmpty = computed(() => rawLines.value.length === 0);

    function openDrawer() {
        drawerOpen.value = true;
        ensureProducts();
    }

    function closeDrawer() {
        drawerOpen.value = false;
    }

    function toggleDrawer() {
        if (!drawerOpen.value) {
            openDrawer();
        } else {
            closeDrawer();
        }
    }

    function setQuantity(id, quantity) {
        setCartQuantity(id, quantity);
    }

    function increment(id) {
        const line = items.value.find((i) => i.id === id);
        if (line && line.quantity < 99) {
            setCartQuantity(id, line.quantity + 1);
        }
    }

    function decrement(id) {
        const line = items.value.find((i) => i.id === id);
        if (line && line.quantity > 1) {
            setCartQuantity(id, line.quantity - 1);
        }
    }

    function removeItem(id) {
        removeFromCart(id);
    }

    function togglePromo() {
        promoExpanded.value = !promoExpanded.value;
    }

    function lineTotalCents(line) {
        return line.priceCents * line.quantity;
    }

    function itemCountLabel(count) {
        if (count === 1) return '(1 item)';
        return `(${count} items)`;
    }

    ensureProducts();

    return {
        items,
        drawerOpen,
        promoExpanded,
        itemCount,
        estimatedTotalCents,
        isEmpty,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setQuantity,
        increment,
        decrement,
        removeItem,
        togglePromo,
        lineTotalCents,
        itemCountLabel
    };
}
