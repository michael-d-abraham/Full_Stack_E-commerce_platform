import { watch, onUnmounted, nextTick } from 'vue';

/**
 * Measures the storefront footer and writes --footer-height on <html> for the
 * sticky reveal layout (margin-bottom / negative margin pairing on site-content).
 * No scroll listeners — measurement only on resize / mount / route changes.
 *
 * @param {object} options
 * @param {import('vue').Ref<boolean>} options.isActive - footer should be shown
 */
export function useSiteFooterHeight({ isActive }) {
  let footerResizeObserver = null;

  function resolveFooterEl() {
    if (!isActive.value) {
      return null;
    }
    return document.querySelector('.site-footer');
  }

  function clearFooterHeight() {
    document.documentElement.style.removeProperty('--footer-height');
  }

  function measureFooterHeight() {
    const footer = resolveFooterEl();
    if (!footer) {
      return;
    }

    const height = Math.ceil(footer.getBoundingClientRect().height);
    if (height > 0) {
      document.documentElement.style.setProperty('--footer-height', `${height}px`);
    }
  }

  function disconnectObserver() {
    footerResizeObserver?.disconnect();
    footerResizeObserver = null;
  }

  function setupObserver() {
    disconnectObserver();
    const footer = resolveFooterEl();
    if (!footer) {
      return;
    }

    measureFooterHeight();
    footerResizeObserver = new ResizeObserver(() => {
      measureFooterHeight();
    });
    footerResizeObserver.observe(footer);
  }

  function syncFooterHeight() {
    nextTick(() => {
      requestAnimationFrame(setupObserver);
    });
  }

  function teardown() {
    disconnectObserver();
    clearFooterHeight();
  }

  watch(
    isActive,
    (active) => {
      if (active) {
        syncFooterHeight();
      } else {
        teardown();
      }
    },
    { immediate: true }
  );

  onUnmounted(teardown);

  return {
    syncFooterHeight,
    teardown
  };
}
