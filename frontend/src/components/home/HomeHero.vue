<template>
  <section
    ref="heroSectionRef"
    class="home-hero hero-display"
    :class="{ 'home-hero--has-background home-section--has-background': Boolean(backgroundImageUrl) }"
    aria-label="Hero"
    @mouseenter="pauseSlideshow"
    @mouseleave="resumeSlideshow"
    @focusin="pauseSlideshow"
    @focusout="onHeroFocusOut"
  >
    <div
      v-if="backgroundImageUrl"
      ref="backgroundRef"
      class="home-hero__background home-section__background"
      :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
      aria-hidden="true"
    />
    <div
      v-if="backgroundImageUrl"
      ref="overlayRef"
      class="home-hero__background-overlay home-section__background-overlay"
      :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
      aria-hidden="true"
    />
    <div class="home-hero__inner hero-display__inner">
      <div class="home-hero__presentation">
        <blockquote v-if="formattedQuote" ref="quoteRef" class="home-hero__quote home-quote">
          {{ formattedQuote }}
        </blockquote>

        <div class="hero-display__stage home-hero__stage">
        <div ref="photoParallaxRef" class="home-hero__photo-parallax">
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

            <button
              v-if="!isMobile"
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
              v-if="!isMobile"
              type="button"
              class="home-hero__nav home-hero__nav--next"
              aria-label="Next hero image"
              @click.stop="goNext"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.75" />
              </svg>
            </button>

            <div
              v-if="!isMobile"
              class="home-hero__dots"
              role="tablist"
              aria-label="Hero slides"
            >
              <button
                v-for="(_, index) in heroImages"
                :key="'hero-dot-' + index"
                type="button"
                class="home-hero__dot"
                :class="{ 'is-active': index === currentIndex }"
                role="tab"
                :aria-selected="index === currentIndex"
                :aria-label="`Go to slide ${index + 1}`"
                @click.stop="goTo(index)"
              />
            </div>
          </div>
        </template>
        </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import { useSectionBackgroundParallax } from '../../composables/useSectionBackgroundParallax.js';
import { useScrollParallax } from '../../composables/useScrollParallax.js';

const SLIDE_INTERVAL_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;
const HERO_CONTROL_SELECTOR = '.home-hero__nav, .home-hero__dot';

const props = defineProps({
  imageUrls: { type: Array, default: () => [] },
  imageUrl: { type: String, default: '' },
  backgroundImageUrl: { type: String, default: '' },
  quote: { type: String, default: '' }
});

const currentIndex = ref(0);
const isPaused = ref(false);
const heroSectionRef = ref(null);
const backgroundRef = ref(null);
const overlayRef = ref(null);
const photoParallaxRef = ref(null);
const quoteRef = ref(null);
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
const isMobile = useMediaQuery('(max-width: 640px)');

const hasBackground = computed(() => Boolean(String(props.backgroundImageUrl || '').trim()));
useSectionBackgroundParallax(heroSectionRef, backgroundRef, hasBackground, overlayRef);

let slideTimerId = null;
let swipeStartX = 0;
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

const hasHeroPhotos = computed(() => heroImages.value.length > 0);
useScrollParallax(heroSectionRef, photoParallaxRef, hasHeroPhotos, {
  desktop: 0.16,
  mobile: 0.11
});

const canSwipe = computed(() => isMobile.value && heroImages.value.length >= 2);

const formattedQuote = computed(() => {
  const raw = props.quote.trim();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('"') || raw.startsWith('“')) {
    return raw;
  }
  return `"${raw}"`;
});

const hasQuote = computed(() => Boolean(formattedQuote.value));
useScrollParallax(heroSectionRef, quoteRef, hasQuote, {
  axis: 'x',
  desktopAxis: 'x',
  mobileAxis: 'y',
  desktop: 0.14,
  mobile: 0.06
});

function clearSlideTimer() {
  if (slideTimerId != null) {
    clearInterval(slideTimerId);
    slideTimerId = null;
  }
}

function wrapIndex(index) {
  const count = heroImages.value.length;
  if (count < 2) return 0;
  return ((index % count) + count) % count;
}

function goTo(index, { restartTimer = true } = {}) {
  const count = heroImages.value.length;
  if (count < 2) return;
  currentIndex.value = wrapIndex(index);
  if (restartTimer) {
    restartSlideTimerAfterNav();
  }
}

function advanceSlide() {
  goTo(currentIndex.value + 1, { restartTimer: false });
}

function goNext() {
  goTo(currentIndex.value + 1);
}

function goPrev() {
  goTo(currentIndex.value - 1);
}

function restartSlideTimerAfterNav() {
  if (isPaused.value || prefersReducedMotion.value) {
    return;
  }
  clearSlideTimer();
  slideTimerId = window.setInterval(advanceSlide, SLIDE_INTERVAL_MS);
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
  slideTimerId = window.setInterval(advanceSlide, SLIDE_INTERVAL_MS);
}

function isControlTarget(target) {
  return target instanceof Element && Boolean(target.closest(HERO_CONTROL_SELECTOR));
}

function applySwipeDelta(delta) {
  if (!canSwipe.value || Math.abs(delta) < SWIPE_THRESHOLD_PX) {
    return false;
  }
  if (delta < 0) {
    goNext();
  } else {
    goPrev();
  }
  return true;
}

function onTouchStart(event) {
  if (!canSwipe.value || isControlTarget(event.target)) {
    return;
  }
  touchSwipeActive = true;
  swipeStartX = event.touches[0]?.clientX ?? 0;
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
  applySwipeDelta(endX - swipeStartX);
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
  position: relative;
  overflow: hidden;
}

.home-hero__inner {
  position: relative;
  z-index: 1;
}

.home-hero__photo-parallax {
  position: relative;
  width: 100%;
  will-change: transform;
}

.home-hero__image {
  border: none;
  border-bottom: none;
  box-shadow: none;
  outline: none;
}

.home-hero__inner {
  max-width: none;
  margin: 0 auto;
  padding: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  height: 100%;
  margin: 0;
  line-height: 0;
}

.home-hero__slideshow-sizer {
  visibility: hidden;
  pointer-events: none;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
}

.home-hero__slideshow-photo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 100%;
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.8s ease;
  object-fit: contain;
  object-position: center;
}

.home-hero__slideshow-photo.is-active {
  opacity: 1;
}

.home-hero__slideshow--swipeable {
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.home-hero__slideshow--swipeable:active {
  cursor: grabbing;
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
  right: auto;
}

.home-hero__nav--next {
  right: 0.5rem;
  left: auto;
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

@media (min-width: 641px) {
  .home-hero__inner {
    max-width: none;
    padding: 0;
  }

  .home-hero__stage {
    width: 100%;
    max-width: 100%;
    height: 100%;
  }

  .home-hero__image,
  .home-hero__image--placeholder {
    max-width: 100%;
    width: auto;
  }

  .home-hero__image--placeholder {
    margin: 0;
  }
}

@media (max-width: 640px) {
  .home-hero__inner {
    max-width: none;
  }

  .home-hero__image--placeholder {
    width: 100%;
    max-width: none;
    aspect-ratio: 4 / 3;
    min-height: 160px;
    max-height: none;
  }

  .home-hero__nav {
    width: 1.75rem;
    height: 1.75rem;
  }

  .home-hero__nav--prev {
    left: 0.35rem;
    right: auto;
  }

  .home-hero__nav--next {
    right: 0.35rem;
    left: auto;
  }

  .home-hero__slideshow {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 100%;
    height: auto;
    margin: 0;
    line-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__photo-parallax {
    will-change: auto;
  }

  .home-hero__slideshow-photo {
    transition: none;
  }

  .home-hero__nav,
  .home-hero__dot {
    transition: none;
  }
}
</style>
