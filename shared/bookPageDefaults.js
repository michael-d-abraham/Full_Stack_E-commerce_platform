const DEFAULT_BOOK_PAGE = {
    show_in_nav: true,
    booking_url: '',
    page_title: 'Book an Appointment',
    body_text:
        'Schedule a consultation or tattoo session. Add your Square, Calendly, or booking link in Admin → Book.',
    button_label: 'Book now'
};

function normalizeOptionalText(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
}

function mergeBookPageLabels(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};
    const text = (key) => {
        const value = base[key] != null ? String(base[key]).trim() : '';
        return value || DEFAULT_BOOK_PAGE[key];
    };

    return {
        show_in_nav: base.show_in_nav !== false,
        booking_url: text('booking_url'),
        page_title: text('page_title'),
        body_text: text('body_text'),
        button_label: text('button_label')
    };
}

module.exports = { DEFAULT_BOOK_PAGE, mergeBookPageLabels };