/** Fixed style tags for gallery work and wanna-do listings. */
const GALLERY_WORK_LABELS = [
    'Blackwork',
    'Fine line',
    'Shading',
    'Color',
    'Floral'
];

function isValidGalleryWorkLabel(value) {
    if (value == null) {
        return false;
    }
    return GALLERY_WORK_LABELS.includes(String(value).trim());
}

module.exports = {
    GALLERY_WORK_LABELS,
    isValidGalleryWorkLabel
};
