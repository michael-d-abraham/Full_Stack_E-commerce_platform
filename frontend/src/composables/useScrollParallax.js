import { onMounted, onUnmounted, watch } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';
import { isViewportDebugEnabled, viewportDebugLogEvent } from './useViewportDebug.js';

const DESKTOP_MQ = '(min-width: 641px)';
const MOBILE_MQ = '(max-width: 640px)';

/**
 * Apply translate3d parallax to an element based on its section scroll position.
 *
 * @param {import('vue').Ref<HTMLElement|null>} sectionRef
 * @param {import('vue').Ref<HTMLElement|null>} targetRef
 * @param {import('vue').Ref<boolean>|import('vue').ComputedRef<boolean>} enabled
 * @param {{ desktop?: number, mobile?: number, axis?: 'x' | 'y', desktopAxis?: 'x' | 'y', mobileAxis?: 'x' | 'y', desktopOnly?: boolean, xMode?: 'default' | 'enter-from-right', maxOffset?: number, mobileMaxOffset?: number }} [rates]
 */
export function useScrollParallax(sectionRef, targetRef, enabled, rates = {}) {
    const desktopRate = rates.desktop ?? 0.16;
    const mobileRate = rates.mobile ?? 0.11;
    const axis = rates.axis ?? 'y';
    const desktopOnly = rates.desktopOnly ?? false;
    const xMode = rates.xMode ?? 'default';
    const maxOffset = rates.maxOffset ?? 320;
    const mobileMaxOffset = rates.mobileMaxOffset ?? Math.round(maxOffset * 0.5);

    const isDesktop = useMediaQuery(DESKTOP_MQ);
    const isMobile = useMediaQuery(MOBILE_MQ);
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    let ticking = false;

    function resolveAxis() {
        if (isDesktop.value) {
            return rates.desktopAxis ?? axis;
        }
        if (isMobile.value) {
            return rates.mobileAxis ?? axis;
        }
        return axis;
    }

    function usesEnterFromRight() {
        return resolveAxis() === 'x' && xMode === 'enter-from-right';
    }

    function applyTransform(el, offset) {
        if (!el) {
            return;
        }
        if (offset === 0) {
            el.style.transform = '';
            return;
        }
        if (resolveAxis() === 'x') {
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
        if (usesEnterFromRight()) {
            return 1;
        }
        if (isDesktop.value) {
            return desktopRate;
        }
        if (isMobile.value) {
            return mobileRate;
        }
        return 0;
    }

    function computeOffset(section, target, rate) {
        if (usesEnterFromRight()) {
            const targetTop = target.getBoundingClientRect().top;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const startTop = viewportHeight * 0.95;
            const settleTop = isMobile.value ? viewportHeight * 0.55 : viewportHeight * 0.38;
            const activeMaxOffset = isMobile.value ? mobileMaxOffset : maxOffset;

            if (targetTop >= startTop) {
                return activeMaxOffset;
            }
            if (targetTop <= settleTop) {
                return 0;
            }

            const progress = (startTop - targetTop) / (startTop - settleTop);
            return (1 - progress) * activeMaxOffset;
        }

        return -section.getBoundingClientRect().top * rate;
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

        if (!section || !target) {
            resetTransform();
            return;
        }

        if (rate === 0 && !usesEnterFromRight()) {
            resetTransform();
            return;
        }

        const offset = computeOffset(section, target, rate);
        applyTransform(target, offset);
    }

    function onScroll() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(updateParallax);
        }
    }

    function onResize() {
        if (isViewportDebugEnabled()) {
            viewportDebugLogEvent('parallax.resize', { handler: 'useScrollParallax' });
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
