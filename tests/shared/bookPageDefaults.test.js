const { DEFAULT_BOOK_PAGE, mergeBookPageLabels } = require('../../shared/bookPageDefaults');

describe('bookPageDefaults', () => {
    it('mergeBookPageLabels fills missing fields from defaults', () => {
        expect(mergeBookPageLabels({})).toEqual(DEFAULT_BOOK_PAGE);
    });

    it('mergeBookPageLabels keeps stored values when present', () => {
        expect(
            mergeBookPageLabels({
                page_title: 'Custom title',
                button_label: 'Schedule now'
            })
        ).toEqual({
            ...DEFAULT_BOOK_PAGE,
            page_title: 'Custom title',
            button_label: 'Schedule now'
        });
    });

    it('mergeBookPageLabels defaults show_in_nav to true', () => {
        expect(mergeBookPageLabels({ show_in_nav: undefined }).show_in_nav).toBe(true);
        expect(mergeBookPageLabels({ show_in_nav: false }).show_in_nav).toBe(false);
    });
});
