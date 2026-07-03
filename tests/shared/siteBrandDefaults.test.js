const {
    DEFAULT_SITE_NAME,
    resolveSiteName,
    normalizeSiteNameInput
} = require('../../shared/siteBrandDefaults');

describe('siteBrandDefaults', () => {
    it('resolveSiteName falls back to PERM when empty', () => {
        expect(resolveSiteName('')).toBe(DEFAULT_SITE_NAME);
        expect(resolveSiteName('   ')).toBe(DEFAULT_SITE_NAME);
        expect(resolveSiteName(null)).toBe(DEFAULT_SITE_NAME);
    });

    it('resolveSiteName returns trimmed custom name', () => {
        expect(resolveSiteName('  My Gallery  ')).toBe('My Gallery');
    });

    it('normalizeSiteNameInput rejects names over 80 characters', () => {
        const result = normalizeSiteNameInput('x'.repeat(81));
        expect(result.errors).toHaveLength(1);
    });

    it('normalizeSiteNameInput accepts empty string', () => {
        expect(normalizeSiteNameInput('')).toEqual({ site_name: '' });
    });
});
