const {
    collectFileIdsFromValues,
    fileIdsRemoved,
    incomingProductImageProviderIds,
    removedProductImageProviderIds,
    collectStoredHomePageFileIds,
    collectParsedHomePageFileIds
} = require('../server/utils/imageKitFileIds');

describe('imageKitFileIds helpers', () => {
    it('fileIdsRemoved returns IDs present before but not after', () => {
        const previous = collectFileIdsFromValues(['file_a', 'file_b']);
        const next = collectFileIdsFromValues(['file_b', 'file_c']);
        expect(fileIdsRemoved(previous, next)).toEqual(['file_a']);
    });

    it('removedProductImageProviderIds ignores rows without provider IDs', () => {
        const existing = [
            { image_provider_id: 'file_a' },
            { image_provider_id: null },
            { image_url: 'https://example.com/r2.jpg' }
        ];
        const incoming = incomingProductImageProviderIds([]);
        expect(removedProductImageProviderIds(existing, incoming)).toEqual(['file_a']);
    });

    it('collectStoredHomePageFileIds uses hero, about, and background file IDs', () => {
        const ids = collectStoredHomePageFileIds({
            hero_image_urls: ['https://example.com/one.jpg'],
            hero_image_file_ids: ['hero_one'],
            about_image_file_id: 'about_one',
            about_me_left_image_file_id: 'about_me_left',
            about_me_right_image_file_id: 'about_me_right',
            hero_background_image_file_id: 'bg_hero',
            featured_background_image_file_id: 'bg_featured',
            about_background_image_file_id: 'bg_about'
        });
        expect([...ids]).toEqual([
            'hero_one',
            'about_one',
            'about_me_left',
            'about_me_right',
            'bg_hero',
            'bg_featured',
            'bg_about'
        ]);
    });

    it('collectParsedHomePageFileIds mirrors stored shape', () => {
        const ids = collectParsedHomePageFileIds({
            hero_image_file_ids: ['hero_one', 'hero_two'],
            about_image_file_id: 'about_one',
            about_me_left_image_file_id: 'about_me_left',
            about_me_right_image_file_id: 'about_me_right',
            hero_background_image_file_id: 'bg_hero',
            featured_background_image_file_id: 'bg_featured',
            about_background_image_file_id: 'bg_about'
        });
        expect([...ids]).toEqual([
            'hero_one',
            'hero_two',
            'about_one',
            'about_me_left',
            'about_me_right',
            'bg_hero',
            'bg_featured',
            'bg_about'
        ]);
    });
});
