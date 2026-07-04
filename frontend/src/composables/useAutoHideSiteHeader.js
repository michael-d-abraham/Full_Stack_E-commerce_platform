import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';

/** Ignore scroll deltas smaller than this to prevent trackpad/touch flicker. */
const SCROLL_DIRECTION_THRESHOLD = 72;

/**
 * Scroll-direction auto-hide for the fixed storefront header.
 * Hides on scroll down, reveals immediately on scroll up.
 *
 * @param {object} options
 * @param {() => boolean} options.isActive - storefront routes only (not admin)
 * @param {() => boolean} options.isScrollLocked - menu/drawer open
 * @param {import('vue').Ref<HTMLElement|null>} options.headerBarRef
 */
export function useAutoHideSiteHeader({ isActive, isScrollLocked, headerBarRef }) {
    const headerHidden = ref(false);
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    let lastScrollY = 0;
    let scrollTicking = false;
    let headerBarResizeObserver = null;

    function resetHeader() {
        headerHidden.value = false;
        lastScrollY = window.scrollY;
    }

    function syncSiteHeaderOffset() {
        const bar = headerBarRef.value;
        if (!bar || !isActive()) {
            document.documentElement.style.removeProperty('--site-header-height');
            document.documentElement.classList.remove('has-fixed-site-header');
            return;
        }

        const height = Math.ceil(bar.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--site-header-height', `${height}px`);
        document.documentElement.classList.add('has-fixed-site-header');
    }

    function updateHeaderOnScroll() {
        scrollTicking = false;

        if (!isActive() || prefersReducedMotion.value || isScrollLocked()) {
            headerHidden.value = false;
            lastScrollY = window.scrollY;
            return;
        }

        const currentScrollY = window.scrollY;

        if (currentScrollY <= 0) {
            headerHidden.value = false;
            lastScrollY = currentScrollY;
            return;
        }

        const delta = currentScrollY - lastScrollY;

        if (Math.abs(delta) > SCROLL_DIRECTION_THRESHOLD) {
            headerHidden.value = delta > 0;
            lastScrollY = currentScrollY;
        }
    }

    function onScroll() {
        if (!scrollTicking) {
            scrollTicking = true;
            window.requestAnimationFrame(updateHeaderOnScroll);
        }
    }

    function teardown() {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', syncSiteHeaderOffset);
        headerBarResizeObserver?.disconnect();
        headerBarResizeObserver = null;
        document.documentElement.classList.remove('has-fixed-site-header');
        document.documentElement.style.removeProperty('--site-header-height');
    }

    function setup() {
        lastScrollY = window.scrollY;
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', syncSiteHeaderOffset, { passive: true });

        nextTick(() => {
            requestAnimationFrame(() => {
                syncSiteHeaderOffset();
                const bar = headerBarRef.value;
                if (bar) {
                    headerBarResizeObserver = new ResizeObserver(syncSiteHeaderOffset);
                    headerBarResizeObserver.observe(bar);
                }
            });
        });
    }

    onMounted(setup);
    onUnmounted(teardown);

    return {
        headerHidden,
        resetHeader,
        syncSiteHeaderOffset
    };
}
