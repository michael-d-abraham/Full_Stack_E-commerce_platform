<template>
  <section
    class="home-hero hero-display"
    aria-label="Hero"
    @mouseenter="pauseSlideshow"
    @mouseleave="resumeSlideshow"
    @focusin="pauseSlideshow"
    @focusout="onHeroFocusOut"
  >
    <div class="home-hero__inner hero-display__inner">
      <div class="hero-display__stage">
        <template v-if="heroImages.length === 0">
          <div
            class="home-hero__image home-hero__image--placeholder"
            role="img"
            aria-label="Hero image placeholder"
          />
        </template>

        <template v-else-if="heroImages.length === 1">
          <img
            class="home-hero__image hero-display__photo"
            :src="heroImages[0]"
            alt=""
          />
        </template>

        <template v-else>
          <div
            class="home-hero__slideshow"
            :class="{ 'home-hero__slideshow--swipeable': canSwipe }"
            role="group"
            :aria-label="`Hero slideshow, slide ${currentIndex + 1} of ${heroImages.length}`"
            @touchstart.passive="onTouchStart"
            @touchend.passive="onTouchEnd"
          >
            <img
              :src="heroImages[0]"
              class="home-hero__image home-hero__slideshow-sizer hero-display__photo"
              alt=""
              aria-hidden="true"
            />
            <img
              v-for="(url, index) in heroImages"
              :key="url + '-' + index"
              class="home-hero__image home-hero__slideshow-photo hero-display__photo"
              :class="{ 'is-active': index === currentIndex }"
              :src="url"
              alt=""
              :aria-hidden="index !== currentIndex"
            />
          </div>

          <button
            type="button"
            class="home-hero__nav home-hero__nav--prev"
            aria-label="Previous hero image"
            @click.stop="goPrev"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.75" />
            </svg>
          </button>
          <button
            type="button"
            class="home-hero__nav home-hero__nav--next"
            aria-label="Next hero image"
            @click.stop="goNext"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.75" />
            </svg>
          </button>

          <div class="home-hero__dots" role="tablist" aria-label="Hero slides">
            <button
              v-for="(_, index) in heroImages"
              :key="'hero-dot-' + index"
              type="button"
              class="home-hero__dot"
              :class="{ 'is-active': index === currentIndex }"
              role="tab"
              :aria-selected="index === currentIndex"
              :aria-label="`Go to slide ${index + 1}`"
              @click="goToSlide(index)"
            />
          </div>
        </template>
      </div>

      <p v-if="showOverlay" class="home-hero__cta">
        <router-link to="/gallery" class="home-hero__cta-link">
          View Collection
        </router-link>
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';

const SLIDE_INTERVAL_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;
const HERO_CONTROL_SELECTOR = '.home-hero__nav, .home-hero__dot';

const props = defineProps({
  imageUrls: { type: Array, default: () => [] },
  imageUrl: { type: String, default: '' }
});

const currentIndex = ref(0);
const isPaused = ref(false);
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
const isMobile = useMediaQuery('(max-width: 640px)');

let slideTimerId = null;
let swipeStartX = 0;
let swipeStartY = 0;
let touchSwipeActive = false;

const heroImages = computed(() => {
  const fromArray = Array.isArray(props.imageUrls)
    ? props.imageUrls.map((url) => String(url).trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) {
    return fromArray;
  }
  const legacy = props.imageUrl != null ? String(props.imageUrl).trim() : '';
  return legacy ? [legacy] : [];
});

const canSwipe = computed(() => isMobile.value && heroImages.value.length > 1);
const showOverlay = computed(() => heroImages.value.length > 0);

function isControlTarget(target) {
  return target instanceof Element && Boolean(target.closest(HERO_CONTROL_SELECTOR));
}

function wrapIndex(index, count) {
  return ((index % count) + count) % count;
}

function clearSlideTimer() {
  if (slideTimerId != null) {
    clearInterval(slideTimerId);
    slideTimerId = null;
  }
}

function goTo(index) {
  const count = heroImages.value.length;
  if (count < 2) {
    return;
  }
  currentIndex.value = wrapIndex(index, count);
}

function restartSlideTimer() {
  if (isPaused.value || prefersReducedMotion.value || heroImages.value.length < 2) {
    return;
  }
  startSlideTimer();
}

function goNext() {
  goTo(currentIndex.value + 1);
  restartSlideTimer();
}

function goPrev() {
  goTo(currentIndex.value - 1);
  restartSlideTimer();
}

function goToSlide(index) {
  goTo(index);
  restartSlideTimer();
}

function startSlideTimer() {
  clearSlideTimer();
  if (
    heroImages.value.length < 2 ||
    isPaused.value ||
    prefersReducedMotion.value
  ) {
    return;
  }
  slideTimerId = window.setInterval(goNext, SLIDE_INTERVAL_MS);
}

function pauseSlideshow() {
  isPaused.value = true;
  clearSlideTimer();
}

function resumeSlideshow() {
  isPaused.value = false;
  startSlideTimer();
}

function onHeroFocusOut(event) {
  const section = event.currentTarget;
  window.requestAnimationFrame(() => {
    if (!section.contains(document.activeElement)) {
      resumeSlideshow();
    }
  });
}

function onTouchStart(event) {
  if (!canSwipe.value) {
    return;
  }
  if (isControlTarget(event.target)) {
    return;
  }
  touchSwipeActive = true;
  swipeStartX = event.touches[0]?.clientX ?? 0;
  swipeStartY = event.touches[0]?.clientY ?? 0;
}

function onTouchEnd(event) {
  if (!touchSwipeActive) {
    return;
  }
  touchSwipeActive = false;

  if (isControlTarget(event.target)) {
    return;
  }

  const endX = event.changedTouches[0]?.clientX ?? 0;
  const endY = event.changedTouches[0]?.clientY ?? 0;
  const deltaX = endX - swipeStartX;
  const deltaY = endY - swipeStartY;

  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    return;
  }

  if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
    return;
  }

  if (deltaX < 0) {
    goNext();
  } else {
    goPrev();
  }
}

watch(
  [heroImages, prefersReducedMotion],
  () => {
    currentIndex.value = 0;
    isPaused.value = false;
    startSlideTimer();
  },
  { immediate: true }
);

watch(isPaused, (paused) => {
  if (!paused) {
    startSlideTimer();
  }
});

onUnmounted(() => {
  clearSlideTimer();
});
</script>

<style scoped>
.home-hero {
  padding: 0;
  background: var(--color-bg);
  border: none;
  border-bottom: none;
}

.home-hero__image {
  border: none;
  border-bottom: none;
  box-shadow: none;
  outline: none;
}

.home-hero__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px;
}

.home-hero__image--placeholder {
  width: 100%;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  max-height: calc(var(--home-hero-max-height) - 2 * var(--space-lg));
  background: var(--color-border);
}

.home-hero__slideshow {
  position: relative;
  display: block;
  width: fit-content;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  line-height: 0;
}

.home-hero__slideshow--swipeable {
  width: 100%;
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
  cursor: grab;
}

.home-hero__slideshow--swipeable:active {
  cursor: grabbing;
}

.home-hero__slideshow-sizer {
  visibility: hidden;
  pointer-events: none;
}

.home-hero__slideshow-photo {
  position: absolute;
  top: 50%;
  left: 50%;
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.8s ease;
}

.home-hero__slideshow-photo.is-active {
  opacity: 1;
}

.home-hero__nav {
  position: absolute;
  top: 50%;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  color: rgba(0, 0, 0, 0.65);
  box-shadow: none;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: 0.72;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.home-hero__nav:hover,
.home-hero__nav:focus-visible {
  opacity: 1;
  background: rgba(255, 255, 255, 0.82);
}

.home-hero__nav:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.home-hero__nav--prev {
  left: 0.5rem;
}

.home-hero__nav--next {
  right: 0.5rem;
}

.home-hero__dots {
  position: absolute;
  left: 50%;
  bottom: 0.65rem;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transform: translateX(-50%);
  line-height: normal;
}

.home-hero__dot {
  width: 0.45rem;
  height: 0.45rem;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.home-hero__dot.is-active {
  background: rgba(255, 255, 255, 0.95);
  transform: scale(1.15);
}

.home-hero__dot:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.home-hero__cta {
  margin: var(--space-lg) 0 0;
  padding: 0;
  text-align: center;
  line-height: normal;
}

.home-hero__cta-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 11rem;
  min-height: 40px;
  padding: 0 1.75rem;
  border: 1px solid var(--color-text);
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.home-hero__cta-link:hover {
  background: var(--color-text);
  color: var(--color-bg);
  opacity: 1;
  text-decoration: none;
}

.home-hero__cta-link:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

@media (min-width: 641px) {
  .home-hero {
    padding-top: var(--space-sm);
    padding-bottom: var(--space-2xl);
  }

  .home-hero__inner {
    max-width: none;
    padding: 0;
  }

  .home-hero__image--placeholder {
    max-width: 85vw;
    max-height: calc(var(--home-hero-max-height) - var(--space-lg) - var(--space-xl));
  }
}

@media (max-width: 640px) {
  .home-hero {
    padding: 0 0 var(--space-xl);
  }

  .home-hero__inner {
    padding: 0;
    max-width: none;
  }

  .home-hero__image--placeholder {
    width: 100%;
    max-width: none;
    aspect-ratio: 4 / 3;
    min-height: 160px;
    max-height: calc(var(--home-hero-max-height) - var(--space-xl));
  }

  .home-hero__nav {
    width: 1.75rem;
    height: 1.75rem;
  }

  .home-hero__nav--prev {
    left: 0.35rem;
  }

  .home-hero__nav--next {
    right: 0.35rem;
  }

  .home-hero__slideshow {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  .home-hero__cta {
    margin-top: var(--space-md);
    padding: 0 var(--mobile-safe-inset-x, 20px);
  }

  .home-hero__cta-link {
    width: 100%;
    max-width: 320px;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__slideshow-photo {
    transition: none;
  }

  .home-hero__nav,
  .home-hero__dot {
    transition: none;
  }
}
</style>
