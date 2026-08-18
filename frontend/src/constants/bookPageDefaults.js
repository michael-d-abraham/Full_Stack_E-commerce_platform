import { DEFAULT_BOOK_PAGE, mergeBookPageLabels } from '@shared/bookPageDefaults.js';

export { DEFAULT_BOOK_PAGE };

export function applyBookPageDefaults(data) {
  const base = data && typeof data === 'object' ? data : {};
  return {
    booking_url: base.booking_url != null ? String(base.booking_url).trim() : '',
    ...mergeBookPageLabels(base)
  };
}