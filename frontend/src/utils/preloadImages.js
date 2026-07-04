/**
 * Preload image URLs with per-image error tolerance and an overall timeout.
 * Resolves when all images finish (load or error) or when timeoutMs elapses.
 */
export function preloadImages(urls, { timeoutMs = 4500 } = {}) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];

  if (!uniqueUrls.length) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(finish, timeoutMs);

    let pending = uniqueUrls.length;

    for (const url of uniqueUrls) {
      const img = new Image();
      const onDone = () => {
        pending -= 1;
        if (pending <= 0) {
          finish();
        }
      };
      img.onload = onDone;
      img.onerror = onDone;
      img.src = url;
    }
  });
}

export const PRELOAD_COUNT_MOBILE = 3;
export const PRELOAD_COUNT_DESKTOP = 6;

export function getPreloadCount(isMobile) {
  return isMobile ? PRELOAD_COUNT_MOBILE : PRELOAD_COUNT_DESKTOP;
}
