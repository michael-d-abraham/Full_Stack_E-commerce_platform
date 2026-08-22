const {
    validatePortfolioCreateBody,
    validatePortfolioUpdateBody
} = require('../server/utils/portfolioValidation');

describe('portfolioValidation', () => {
    const validImage = {
        image_url: 'https://example.com/a.jpg',
        is_primary: true
    };

    it('requires label on create', () => {
        const result = validatePortfolioCreateBody({ images: [validImage] });
        expect(result?.errors).toContain('label is required');
    });

    it('rejects invalid gallery labels on create', () => {
        const result = validatePortfolioCreateBody({
            label: 'Watercolor',
            images: [validImage]
        });
        expect(result?.errors).toContain('label must be one of the allowed gallery labels');
    });

    it('accepts valid gallery create payload', () => {
        const result = validatePortfolioCreateBody({
            label: 'Blackwork',
            images: [validImage]
        });
        expect(result).toBeNull();
    });

    it('validates label on update when provided', () => {
        const result = validatePortfolioUpdateBody({ label: 'Not a label' });
        expect(result?.errors).toContain('label must be one of the allowed gallery labels');
    });
});
