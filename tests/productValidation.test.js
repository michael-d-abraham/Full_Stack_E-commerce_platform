const {
    validateProductCreateBody,
    validateProductUpdateBody
} = require('../server/utils/productValidation');

describe('productValidation', () => {
    const validImage = {
        image_url: 'https://example.com/a.jpg',
        is_primary: true
    };

    it('requires label on create', () => {
        const result = validateProductCreateBody({ images: [validImage] });
        expect(result?.errors).toContain('label is required');
    });

    it('rejects invalid listing labels on create', () => {
        const result = validateProductCreateBody({
            label: 'Realism',
            images: [validImage]
        });
        expect(result?.errors).toContain('label must be one of the allowed gallery labels');
    });

    it('requires at least one photo on create', () => {
        const result = validateProductCreateBody({ label: 'Fine line' });
        expect(result?.errors).toContain('At least one photo is required');
    });

    it('accepts a valid wanna-do create payload', () => {
        const result = validateProductCreateBody({
            label: 'Fine line',
            images: [validImage]
        });
        expect(result).toBeNull();
    });

    it('does not require title, description, or price on create', () => {
        const result = validateProductCreateBody({
            label: 'Fine line',
            images: [validImage]
        });
        expect(result).toBeNull();
        expect(result?.errors || []).not.toEqual(
            expect.arrayContaining([
                'title is required',
                'description is required',
                'price_cents is required'
            ])
        );
    });

    it('validates label on update when provided', () => {
        const result = validateProductUpdateBody({ label: 'Not a label' });
        expect(result?.errors).toContain('label must be one of the allowed gallery labels');
    });

    it('requires at least one photo when images are sent on update', () => {
        const result = validateProductUpdateBody({ images: [] });
        expect(result?.errors).toContain('At least one photo is required');
    });
});
