import { onMounted, onUnmounted, watch } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';

const DESKTOP_MQ = '(min-width: 641px)';
const PARALLAX_RATE = 0.38;

/**
 * Subtle scroll parallax for a full-bleed section background texture (desktop only).
 * @param {import('vue').Ref<HTMLElement|null>} sectionRef
 * @param {import('vue').Ref<HTMLElement|null>} backgroundRef
 * @param {import('vue').Ref<boolean>|import('vue').ComputedRef<boolean>} enabled
 */
export function useSectionBackgroundParallax(sectionRef, backgroundRef, enabled) {
    const isDesktop = useMediaQuery(DESKTOP_MQ);
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    let ticking = false;

    function resetTransform() {
        const bg = backgroundRef.value;
        if (bg) {
            bg.style.transform = '';
        }
    }

    function updateParallax() {
        ticking = false;

        if (!enabled.value || !isDesktop.value || prefersReducedMotion.value) {
            resetTransform();
            return;
        }

        const section = sectionRef.value;
        const bg = backgroundRef.value;
        if (!section || !bg) {
            return;
        }

        const offset = -section.getBoundingClientRect().top * PARALLAX_RATE;
        bg.style.transform = `translate3d(0, ${offset}px, 0)`;
    }

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
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

    watch([enabled, isDesktop, prefersReducedMotion], () => {
        updateParallax();
    });
}

/** @deprecated Use useSectionBackgroundParallax */
export const useHeroBackgroundParallax = useSectionBackgroundParallax;
