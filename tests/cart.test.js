/**
 * @jest-environment jsdom
 */

jest.mock('../frontend/src/services/api.js', () => ({
    getCartSession: jest.fn(() => Promise.resolve({ items: [] })),
    putCartSession: jest.fn(() => Promise.resolve({}))
}));

const {
    addToCart,
    getCart,
    clearCart,
    getCheckoutItems,
    setCartQuantity,
    setBuyNowCart
} = require('../frontend/src/utils/cart');

describe('cart localStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('getCheckoutItems sends only product_id and quantity (no prices)', () => {
        addToCart({
            _id: '507f1f77bcf86cd799439011',
            slug: 'test-print',
            title: 'Test',
            price_cents: 9999,
            quantity_available: 5
        });

        const payload = getCheckoutItems();
        expect(payload).toEqual([
            {
                product_id: '507f1f77bcf86cd799439011',
                quantity: 1
            }
        ]);
        expect(payload[0]).not.toHaveProperty('price_cents');
        expect(payload[0]).not.toHaveProperty('unit_price_cents');
    });

    it('clearCart empties the cart after successful purchase flow', () => {
        addToCart({
            _id: '507f1f77bcf86cd799439012',
            slug: 'another',
            quantity_available: 2
        });
        expect(getCart()).toHaveLength(1);

        clearCart();
        expect(getCart()).toEqual([]);
    });

    it('setCartQuantity clamps below min and above max', () => {
        addToCart({
            _id: '507f1f77bcf86cd799439013',
            slug: 'clamp-test',
            quantity_available: 200
        });

        setCartQuantity('507f1f77bcf86cd799439013', 0);
        expect(getCart()[0].quantity).toBe(1);

        setCartQuantity('507f1f77bcf86cd799439013', 150);
        expect(getCart()[0].quantity).toBe(99);
    });

    it('setBuyNowCart clamps quantity to max', () => {
        setBuyNowCart(
            {
                _id: '507f1f77bcf86cd799439014',
                slug: 'buy-now',
                quantity_available: 200
            },
            150
        );

        expect(getCart()).toEqual([
            expect.objectContaining({
                productId: '507f1f77bcf86cd799439014',
                slug: 'buy-now',
                quantity: 99
            })
        ]);
    });

    it('persists a display snapshot so cart lines stay visible without catalog hydration', () => {
        addToCart({
            _id: '507f1f77bcf86cd799439015',
            slug: 'snapshot-print',
            title: 'Snapshot Print',
            price_cents: 4500,
            size_label: '11x14',
            quantity_available: 3,
            product_images: [{ image_url: 'https://ik.imagekit.io/demo/a.jpg', is_primary: true }]
        });

        const line = getCart()[0];
        expect(line).toEqual(
            expect.objectContaining({
                productId: '507f1f77bcf86cd799439015',
                slug: 'snapshot-print',
                quantity: 1,
                title: 'Snapshot Print',
                priceCents: 4500,
                sizeLabel: '11x14',
                imageUrl: 'https://ik.imagekit.io/demo/a.jpg'
            })
        );
    });
});
