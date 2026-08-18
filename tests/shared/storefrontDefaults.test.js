const {
    GALLERY_NAV_LABEL,
    GALLERY_PAGE_TITLE,
    GALLERY_SECTION_LABEL,
    GALLERY_EMPTY_MESSAGE,
    WANNA_DOS_NAV_LABEL,
    WANNA_DOS_PAGE_TITLE,
    WANNA_DOS_SECTION_LABEL,
    WANNA_DOS_EMPTY_MESSAGE,
    DEFAULT_SHOW_CART
} = require('../../shared/storefrontDefaults');

describe('shared/storefrontDefaults', () => {
    it('uses separate Gallery and Wanna Do\'s labels', () => {
        expect(GALLERY_NAV_LABEL).toBe('Gallery');
        expect(GALLERY_PAGE_TITLE).toBe('Gallery');
        expect(GALLERY_EMPTY_MESSAGE).toBe('No finished work uploaded yet.');
        expect(WANNA_DOS_NAV_LABEL).toBe("Wanna Do's");
        expect(WANNA_DOS_PAGE_TITLE).toBe("Wanna Do's");
        expect(WANNA_DOS_SECTION_LABEL).toBe("Wanna Do's");
        expect(WANNA_DOS_EMPTY_MESSAGE).toBe("No wanna do's uploaded yet.");
    });

    it('hides cart by default', () => {
        expect(DEFAULT_SHOW_CART).toBe(false);
    });
});
