import { onMounted, onUnmounted, nextTick } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';
import { isViewportDebugEnabled, viewportDebugLogEvent } from './useViewportDebug.js';

const DEFAULT_SCROLL_DISTANCE = 120;

/**
 * Continuous scroll-progress for the storefront header.
 * Writes --nav-scroll directly to the header element (no Vue re-renders).
 *
 * @param {object} options
 * @param {() => boolean} options.isActive
 * @param {() => boolean} options.isScrollLocked - menu/drawer open
 * @param {import('vue').Ref<HTMLElement|null>} options.headerRef
 * @param {import('vue').Ref<HTMLElement|null>} options.headerBarRef
 */
export function useSiteHeaderScroll({ isActive, isScrollLocked, headerRef, headerBarRef }) {
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    let scrollTicking = false;
    let headerBarResizeObserver = null;
    let lastNavScroll = -1;
    let expandedHeaderHeight = 0;

    function getScrollDistance() {
        const header = headerRef.value;
        if (!header) {
            return DEFAULT_SCROLL_DISTANCE;
        }

        const raw = getComputedStyle(header).getPropertyValue('--nav-scroll-distance').trim();
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SCROLL_DISTANCE;
    }

    function computeNavScroll() {
        if (isScrollLocked()) {
            return 1;
        }

        if (prefersReducedMotion.value) {
            return window.scrollY > 0 ? 1 : 0;
        }

        const distance = getScrollDistance();
        return Math.min(1, Math.max(0, window.scrollY / distance));
    }

    function applyNavScroll(progress) {
        const header = headerRef.value;
        if (!header || !isActive()) {
            return;
        }

        const rounded = Number(progress.toFixed(3));
        if (rounded === lastNavScroll) {
            return;
        }

        lastNavScroll = rounded;
        header.style.setProperty('--nav-scroll', String(rounded));

        if (isViewportDebugEnabled()) {
            viewportDebugLogEvent('header-scroll.sync', { navScroll: rounded, scrollY: window.scrollY });
        }
    }

    function measureExpandedHeaderHeight() {
        const bar = headerBarRef.value;
        if (!bar || !isActive()) {
            return;
        }

        const height = Math.ceil(bar.getBoundingClientRect().height);
        if (height > 0) {
            expandedHeaderHeight = height;
        }
    }

    function syncExpandedHeaderHeight() {
        if (!isActive()) {
            document.documentElement.style.removeProperty('--site-header-height');
            document.documentElement.classList.remove('has-fixed-site-header');
            return;
        }

        if (expandedHeaderHeight <= 0) {
            measureExpandedHeaderHeight();
        }

        if (expandedHeaderHeight <= 0) {
            return;
        }

        document.documentElement.style.setProperty(
            '--site-header-height',
            `${expandedHeaderHeight}px`
        );
        document.documentElement.classList.add('has-fixed-site-header');

        if (isViewportDebugEnabled()) {
            viewportDebugLogEvent('header-offset.sync', { height: expandedHeaderHeight });
        }
    }

    function updateHeaderOnScroll() {
        scrollTicking = false;

        if (!isActive()) {
            return;
        }

        applyNavScroll(computeNavScroll());
    }

    function onScroll() {
        if (!scrollTicking) {
            scrollTicking = true;
            window.requestAnimationFrame(updateHeaderOnScroll);
        }
    }

    function syncHeader() {
        if (!isActive()) {
            return;
        }

        measureExpandedHeaderHeight();
        applyNavScroll(computeNavScroll());
        syncExpandedHeaderHeight();
    }

    function resetHeader() {
        lastNavScroll = -1;
        syncHeader();
    }

    function teardown() {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        headerBarResizeObserver?.disconnect();
        headerBarResizeObserver = null;
        document.documentElement.classList.remove('has-fixed-site-header');
        document.documentElement.style.removeProperty('--site-header-height');

        const header = headerRef.value;
        if (header) {
            header.style.removeProperty('--nav-scroll');
        }

        lastNavScroll = -1;
    }

    function onResize() {
        measureExpandedHeaderHeight();
        syncExpandedHeaderHeight();
        applyNavScroll(computeNavScroll());
    }

    function setup() {
        nextTick(() => {
            requestAnimationFrame(() => {
                syncHeader();
                const bar = headerBarRef.value;
                if (bar) {
                    headerBarResizeObserver = new ResizeObserver(() => {
                        measureExpandedHeaderHeight();
                        syncExpandedHeaderHeight();
                    });
                    headerBarResizeObserver.observe(bar);
                }
            });
        });

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
    }

    onMounted(setup);
    onUnmounted(teardown);

    return {
        resetHeader,
        syncSiteHeaderOffset: syncExpandedHeaderHeight,
        syncHeader
    };
}
