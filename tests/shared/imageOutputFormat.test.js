const {
    normalizeImageMime,
    mimeSupportsAlpha,
    shouldSkipRasterEditor,
    resolveEditorOutputFromSource
} = require('../../shared/imageOutputFormat');

describe('shared/imageOutputFormat', () => {
    it('normalizes image/jpg to image/jpeg', () => {
        expect(normalizeImageMime('image/jpg')).toBe('image/jpeg');
    });

    it('detects alpha-capable MIME types', () => {
        expect(mimeSupportsAlpha('image/png')).toBe(true);
        expect(mimeSupportsAlpha('image/webp')).toBe(true);
        expect(mimeSupportsAlpha('image/jpeg')).toBe(false);
        expect(mimeSupportsAlpha('image/svg+xml')).toBe(false);
    });

    it('skips raster editor for SVG', () => {
        expect(shouldSkipRasterEditor('image/svg+xml')).toBe(true);
        expect(shouldSkipRasterEditor('image/png')).toBe(false);
    });

    it('preserves PNG output for transparent PNG sources', () => {
        expect(
            resolveEditorOutputFromSource({
                sourceMime: 'image/png',
                outputBaseName: 'hero-background'
            })
        ).toEqual({
            skipEditor: false,
            outputMime: 'image/png',
            outputFileName: 'hero-background.png',
            outputQuality: undefined
        });
    });

    it('preserves WebP output for transparent WebP sources', () => {
        expect(
            resolveEditorOutputFromSource({
                sourceMime: 'image/webp',
                outputBaseName: 'about-background'
            })
        ).toEqual({
            skipEditor: false,
            outputMime: 'image/webp',
            outputFileName: 'about-background.webp',
            outputQuality: 0.92
        });
    });

    it('uploads SVG without opening the raster editor', () => {
        expect(
            resolveEditorOutputFromSource({
                sourceMime: 'image/svg+xml',
                outputBaseName: 'about-background'
            })
        ).toEqual({
            skipEditor: true,
            outputMime: 'image/svg+xml',
            outputFileName: 'about-background.svg'
        });
    });

    it('keeps JPEG output for photo uploads', () => {
        expect(
            resolveEditorOutputFromSource({
                sourceMime: 'image/jpeg',
                outputBaseName: 'hero'
            })
        ).toEqual({
            skipEditor: false,
            outputMime: 'image/jpeg',
            outputFileName: 'hero.jpg',
            outputQuality: 0.92
        });
    });

    it('infers format from file extension when MIME is missing', () => {
        expect(
            resolveEditorOutputFromSource({
                sourceName: 'texture.png',
                outputBaseName: 'hero-background'
            }).outputMime
        ).toBe('image/png');
    });
});
