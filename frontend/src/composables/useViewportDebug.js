import { ref, shallowRef, onMounted, onUnmounted } from 'vue';

const QUERY_KEY = 'viewportDebug';

let enabled = false;
let logBuffer = [];
const MAX_LOG_LINES = 40;

export const viewportDebugActive = ref(false);
export const viewportDebugMetrics = shallowRef({});
export const viewportDebugLog = shallowRef([]);

function isDebugQuery() {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get(QUERY_KEY) === '1';
}

export function isViewportDebugEnabled() {
  return enabled;
}

export function viewportDebugLogEvent(source, detail = {}) {
  if (!enabled) {
    return;
  }
  const entry = {
    t: Date.now(),
    source,
    ...detail
  };
  logBuffer = [entry, ...logBuffer].slice(0, MAX_LOG_LINES);
  viewportDebugLog.value = logBuffer;
  console.debug('[viewportDebug]', source, detail);
}

function readMaxHeight(el) {
  if (!el || typeof window === 'undefined') {
    return null;
  }
  const value = window.getComputedStyle(el).maxHeight;
  return value === 'none' ? 'none' : value;
}

function collectMetrics() {
  const vv = window.visualViewport;
  const overlayEl = document.querySelector('.product-detail-overlay');
  const cardEl = document.querySelector('.product-page__content--overlay');
  const detailsEl = document.querySelector('.product-page__details--stacked');
  const galleryEl = document.querySelector('.product-page__content--overlay .product-image-gallery');

  return {
    innerHeight: window.innerHeight,
    outerHeight: window.outerHeight,
    clientHeight: document.documentElement.clientHeight,
    visualViewportHeight: vv?.height ?? null,
    visualViewportOffsetTop: vv?.offsetTop ?? null,
    scrollY: window.scrollY,
    bodyTop: document.body.style.top || '(unset)',
    bodyPosition: document.body.style.position || '(unset)',
    overlayHeight: overlayEl?.getBoundingClientRect().height ?? null,
    cardHeight: cardEl?.getBoundingClientRect().height ?? null,
    cardMaxHeight: readMaxHeight(cardEl),
    detailsClientHeight: detailsEl?.clientHeight ?? null,
    detailsScrollTop: detailsEl?.scrollTop ?? null,
    galleryHeight: galleryEl?.getBoundingClientRect().height ?? null,
    commitSha: typeof __APP_COMMIT_SHA__ !== 'undefined' ? __APP_COMMIT_SHA__ : 'unknown',
    buildMode: import.meta.env.MODE
  };
}

let rafId = 0;
let lastMetricsJson = '';

function tick() {
  if (!enabled) {
    return;
  }
  const next = collectMetrics();
  const json = JSON.stringify(next);
  if (json !== lastMetricsJson) {
    lastMetricsJson = json;
    viewportDebugMetrics.value = next;
  }
  rafId = window.requestAnimationFrame(tick);
}

function onWindowResize() {
  viewportDebugLogEvent('window.resize', {
    innerHeight: window.innerHeight,
    clientHeight: document.documentElement.clientHeight
  });
}

function onVisualViewportResize() {
  const vv = window.visualViewport;
  viewportDebugLogEvent('visualViewport.resize', {
    height: vv?.height,
    offsetTop: vv?.offsetTop,
    scale: vv?.scale
  });
}

function onVisualViewportScroll() {
  const vv = window.visualViewport;
  viewportDebugLogEvent('visualViewport.scroll', {
    offsetTop: vv?.offsetTop,
    pageTop: vv?.pageTop
  });
}

function onDocumentScroll() {
  viewportDebugLogEvent('document.scroll', { scrollY: window.scrollY });
}

function onDetailsScroll(event) {
  const el = event.target;
  if (!el?.classList?.contains('product-page__details--stacked')) {
    return;
  }
  viewportDebugLogEvent('details.scroll', {
    scrollTop: el.scrollTop,
    clientHeight: el.clientHeight
  });
}

export function useViewportDebugBootstrap() {
  onMounted(() => {
    enabled = isDebugQuery();
    viewportDebugActive.value = enabled;
    if (!enabled) {
      return;
    }

    viewportDebugLogEvent('bootstrap', { href: window.location.href });
    viewportDebugMetrics.value = collectMetrics();
    lastMetricsJson = JSON.stringify(viewportDebugMetrics.value);

    window.addEventListener('resize', onWindowResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onVisualViewportResize, { passive: true });
    window.visualViewport?.addEventListener('scroll', onVisualViewportScroll, { passive: true });
    window.addEventListener('scroll', onDocumentScroll, { passive: true });
    document.addEventListener('scroll', onDetailsScroll, true);

    rafId = window.requestAnimationFrame(tick);
  });

  onUnmounted(() => {
    if (!enabled) {
      return;
    }
    window.cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onWindowResize);
    window.visualViewport?.removeEventListener('resize', onVisualViewportResize);
    window.visualViewport?.removeEventListener('scroll', onVisualViewportScroll);
    window.removeEventListener('scroll', onDocumentScroll);
    document.removeEventListener('scroll', onDetailsScroll, true);
    enabled = false;
    viewportDebugActive.value = false;
  });
}
