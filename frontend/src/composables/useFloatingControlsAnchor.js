import { ref, onMounted, onUnmounted, watch } from 'vue';
import { isViewportDebugEnabled, viewportDebugLogEvent } from './useViewportDebug.js';

export function useFloatingControlsAnchor(anchorRef, { enabled } = {}) {
  const anchorStyle = ref({ display: 'none' });

  function isEnabled() {
    return typeof enabled !== 'function' || enabled();
  }

  function updateAnchor() {
    const el = anchorRef.value;
    if (!el || !isEnabled()) {
      anchorStyle.value = { display: 'none' };
      return;
    }

    const rect = el.getBoundingClientRect();
    anchorStyle.value = {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      pointerEvents: 'none',
      zIndex: 1060
    };

    if (isViewportDebugEnabled()) {
      viewportDebugLogEvent('floating-anchor.update', {
        top: rect.top,
        height: rect.height
      });
    }
  }

  let resizeObserver = null;

  function bindListeners() {
    window.addEventListener('scroll', updateAnchor, true);
    window.addEventListener('resize', updateAnchor);
    resizeObserver = new ResizeObserver(updateAnchor);
    if (anchorRef.value) {
      resizeObserver.observe(anchorRef.value);
    }
  }

  function unbindListeners() {
    window.removeEventListener('scroll', updateAnchor, true);
    window.removeEventListener('resize', updateAnchor);
    resizeObserver?.disconnect();
    resizeObserver = null;
  }

  onMounted(() => {
    bindListeners();
    updateAnchor();
  });

  onUnmounted(unbindListeners);

  watch(anchorRef, (el, previous, onCleanup) => {
    if (previous && resizeObserver) {
      resizeObserver.unobserve(previous);
    }
    if (el && resizeObserver) {
      resizeObserver.observe(el);
    }
    updateAnchor();
    onCleanup(() => {
      if (el && resizeObserver) {
        resizeObserver.unobserve(el);
      }
    });
  });

  if (typeof enabled === 'function') {
    watch(enabled, updateAnchor);
  }

  return {
    anchorStyle,
    updateAnchor
  };
}
