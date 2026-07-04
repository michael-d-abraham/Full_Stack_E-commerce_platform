import { ref, watch, computed, unref } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';
import { primaryProductImageUrl } from '../utils/storefrontProduct.js';
import { getPreloadCount, preloadImages } from '../utils/preloadImages.js';

const MOBILE_MQ = '(max-width: 640px)';

/**
 * Preload the first visible product images after products become available.
 */
export function useInitialImagePreload(productsSource, { timeoutMs = 4500, enabled = true } = {}) {
  const isMobile = useMediaQuery(MOBILE_MQ);
  const imagesReady = ref(false);
  const preloading = ref(false);

  const preloadCount = computed(() => getPreloadCount(isMobile.value));

  let runId = 0;

  async function runPreload(products) {
    const id = ++runId;

    if (!enabled || !products?.length) {
      preloading.value = false;
      imagesReady.value = true;
      return;
    }

    const urls = products
      .slice(0, preloadCount.value)
      .map(primaryProductImageUrl)
      .filter(Boolean);

    if (!urls.length) {
      preloading.value = false;
      imagesReady.value = true;
      return;
    }

    preloading.value = true;
    imagesReady.value = false;

    await preloadImages(urls, { timeoutMs });

    if (id !== runId) {
      return;
    }

    preloading.value = false;
    imagesReady.value = true;
  }

  watch(
    [() => unref(productsSource), () => unref(enabled)],
    ([products, isEnabled]) => {
      if (!isEnabled) {
        runId += 1;
        preloading.value = false;
        imagesReady.value = true;
        return;
      }
      runPreload(products);
    },
    { immediate: true }
  );

  return { imagesReady, preloading, preloadCount, isMobile };
}
