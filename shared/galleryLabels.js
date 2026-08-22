/** Fixed style labels for finished gallery work. */
const GALLERY_WORK_LABELS = [
    'Blackwork',
    'Fine line',
    'Realism',
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
