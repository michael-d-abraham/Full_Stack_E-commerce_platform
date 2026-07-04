import { DEFAULT_CONTACT_PAGE, mergeContactPageLabels } from '@shared/contactPageDefaults.js';

export { DEFAULT_CONTACT_PAGE };

export function applyContactPageDefaults(data) {
  const base = data && typeof data === 'object' ? data : {};
  return {
    contact_hero_image_url:
      base.contact_hero_image_url != null ? String(base.contact_hero_image_url).trim() : '',
    contact_hero_image_file_id:
      base.contact_hero_image_file_id != null
        ? String(base.contact_hero_image_file_id).trim()
        : '',
    ...mergeContactPageLabels(base)
  };
}
