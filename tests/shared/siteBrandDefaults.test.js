const {
    DEFAULT_SITE_NAME,
    resolveSiteName,
    resolveSiteBranding,
    normalizeSiteNameInput,
    normalizeSiteBrandingInput
} = require('../../shared/siteBrandDefaults');

function alwaysValidUrl() {
    return true;
}

describe('siteBrandDefaults', () => {
    it('resolveSiteName falls back to Madd Lines when empty', () => {
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

    it('resolveSiteBranding uses image mode only when a logo URL exists', () => {
        expect(
            resolveSiteBranding({
                site_name: 'Basquiat',
                site_name_mode: 'image',
                site_name_logo_url: 'https://example.com/logo.png'
            })
        ).toEqual({
            site_name: 'Basquiat',
            site_name_mode: 'image',
            site_name_logo_url: 'https://example.com/logo.png'
        });
    });

    it('resolveSiteBranding falls back to text when image mode has no logo', () => {
        expect(
            resolveSiteBranding({
                site_name: 'Basquiat',
                site_name_mode: 'image',
                site_name_logo_url: ''
            })
        ).toEqual({
            site_name: 'Basquiat',
            site_name_mode: 'text',
            site_name_logo_url: ''
        });
    });

    it('normalizeSiteBrandingInput requires logo URL for image mode', () => {
        const result = normalizeSiteBrandingInput(
            {
                site_name: 'Basquiat',
                site_name_mode: 'image',
                site_name_logo_url: ''
            },
            { isValidHttpUrl: alwaysValidUrl }
        );
        expect(result.errors).toContain('site_name_logo_url is required when site_name_mode is image');
    });
});
