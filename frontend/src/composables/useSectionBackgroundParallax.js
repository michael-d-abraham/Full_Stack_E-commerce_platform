import { onMounted, onUnmounted, watch } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';
import { isViewportDebugEnabled, viewportDebugLogEvent } from './useViewportDebug.js';

const DESKTOP_MQ = '(min-width: 641px)';
const MOBILE_MQ = '(max-width: 640px)';

/** Desktop-only rate — unchanged from original implementation. */
const DESKTOP_PARALLAX_RATE = 0.38;

/** Mobile background texture — subtle, slow drift. */
const MOBILE_BACKGROUND_PARALLAX_RATE = 0.08;

/** Mobile overlay texture — slightly faster for layered depth. */
const MOBILE_OVERLAY_PARALLAX_RATE = 0.12;

/**
 * Subtle scroll parallax for full-bleed section background textures.
 * Desktop: single layer at DESKTOP_PARALLAX_RATE (unchanged).
 * Mobile: background + optional overlay layers via translate3d (no fixed attachment).
 *
 * @param {import('vue').Ref<HTMLElement|null>} sectionRef
 * @param {import('vue').Ref<HTMLElement|null>} backgroundRef
 * @param {import('vue').Ref<boolean>|import('vue').ComputedRef<boolean>} enabled
 * @param {import('vue').Ref<HTMLElement|null>|null} [overlayRef] mobile overlay layer
 */
export function useSectionBackgroundParallax(sectionRef, backgroundRef, enabled, overlayRef = null) {
    const isDesktop = useMediaQuery(DESKTOP_MQ);
    const isMobile = useMediaQuery(MOBILE_MQ);
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    let ticking = false;

    function applyTransform(el, offsetY) {
        if (!el) {
            return;
        }
        el.style.transform = offsetY === 0 ? '' : `translate3d(0, ${offsetY}px, 0)`;
    }

    function resetTransform() {
        applyTransform(backgroundRef.value, 0);
        applyTransform(overlayRef?.value, 0);
    }

    function updateParallax() {
        ticking = false;

        if (!enabled.value || prefersReducedMotion.value) {
            resetTransform();
            return;
        }

        const section = sectionRef.value;
        const bg = backgroundRef.value;
        if (!section || !bg) {
            return;
        }

        const sectionTop = section.getBoundingClientRect().top;

        if (isDesktop.value) {
            const offset = -sectionTop * DESKTOP_PARALLAX_RATE;
            applyTransform(bg, offset);
            applyTransform(overlayRef?.value, 0);
            return;
        }

        if (isMobile.value) {
            applyTransform(bg, -sectionTop * MOBILE_BACKGROUND_PARALLAX_RATE);

            const overlay = overlayRef?.value;
            if (overlay) {
                applyTransform(overlay, -sectionTop * MOBILE_OVERLAY_PARALLAX_RATE);
            }
        }
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateParallax);
        }
    }

    function onResize() {
        if (isViewportDebugEnabled()) {
            viewportDebugLogEvent('parallax.resize', { handler: 'useSectionBackgroundParallax' });
        }
        onScroll();
    }

    onMounted(() => {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        updateParallax();
    });

    onUnmounted(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        resetTransform();
    });

    watch([enabled, isDesktop, isMobile, prefersReducedMotion], () => {
        updateParallax();
    });
}

/** @deprecated Use useSectionBackgroundParallax */
export const useHeroBackgroundParallax = useSectionBackgroundParallax;
