const DEFAULT_BOOK_PAGE = {
    show_in_nav: true,
    booking_url: 'https://app.squareup.com/appointments/book/937xx9jiszps1s/LHGHGV5HBBBQW/start',
    page_title: 'Book an Appointment',
    body_text: 'Schedule a tattoo consultation or appointment through Square.',
    button_label: 'Book with Square'
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