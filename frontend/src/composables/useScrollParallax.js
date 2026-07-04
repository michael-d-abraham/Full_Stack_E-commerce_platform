import { onMounted, onUnmounted, watch } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';

const DESKTOP_MQ = '(min-width: 641px)';
const MOBILE_MQ = '(max-width: 640px)';

/**
 * Apply translate3d parallax to an element based on its section scroll position.
 *
 * @param {import('vue').Ref<HTMLElement|null>} sectionRef
 * @param {import('vue').Ref<HTMLElement|null>} targetRef
 * @param {import('vue').Ref<boolean>|import('vue').ComputedRef<boolean>} enabled
 * @param {{ desktop?: number, mobile?: number, axis?: 'x' | 'y', desktopOnly?: boolean }} [rates]
 */
export function useScrollParallax(sectionRef, targetRef, enabled, rates = {}) {
    const desktopRate = rates.desktop ?? 0.16;
    const mobileRate = rates.mobile ?? 0.11;
    const axis = rates.axis ?? 'y';
    const desktopOnly = rates.desktopOnly ?? false;

    const isDesktop = useMediaQuery(DESKTOP_MQ);
    const isMobile = useMediaQuery(MOBILE_MQ);
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    let ticking = false;

    function applyTransform(el, offset) {
        if (!el) {
            return;
        }
        if (offset === 0) {
            el.style.transform = '';
            return;
        }
        if (axis === 'x') {
            el.style.transform = `translate3d(${offset}px, 0, 0)`;
            return;
        }
        el.style.transform = `translate3d(0, ${offset}px, 0)`;
    }

    function resetTransform() {
        applyTransform(targetRef.value, 0);
    }

    function resolveRate() {
        if (desktopOnly && !isDesktop.value) {
            return 0;
        }
        if (isDesktop.value) {
            return desktopRate;
        }
        if (isMobile.value) {
            return mobileRate;
        }
        return 0;
    }

    function updateParallax() {
        ticking = false;

        if (!enabled.value || prefersReducedMotion.value) {
            resetTransform();
            return;
        }

        const section = sectionRef.value;
        const target = targetRef.value;
        const rate = resolveRate();

        if (!section || !target || rate === 0) {
            resetTransform();
            return;
        }

        const offset = -section.getBoundingClientRect().top * rate;
        applyTransform(target, offset);
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateParallax);
        }
    }

    onMounted(() => {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        updateParallax();
    });

    onUnmounted(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        resetTransform();
    });

    watch([enabled, isDesktop, isMobile, prefersReducedMotion], () => {
        updateParallax();
    });
}
