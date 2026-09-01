<template>
  <section
    id="landing"
    class="home-landing home-section"
    aria-label="hero"
  >
    <div
      class="home-landing__slides"
      aria-live="polite"
      :aria-label="slides.length > 1 ? 'landing slideshow' : 'landing media'"
    >
      <figure
        v-for="(slide, index) in slides"
        :key="slide.key"
        class="home-landing__slide"
        :class="{ 'home-landing__slide--active': index === activeIndex }"
        :aria-hidden="index === activeIndex ? undefined : true"
      >
        <video
          v-if="slide.type === 'video'"
          :ref="(el) => setVideoRef(el, index)"
          class="home-landing__video"
          :src="slide.src"
          muted
          :loop="slides.length === 1"
          playsinline
          preload="metadata"
          :aria-label="slide.alt"
          @ended="onVideoEnded(index)"
        />
        <SmartImage
          v-else
          :src="slide.src"
          :alt="slide.alt"
          layout="fill"
          object-fit="cover"
          :width="1400"
          :widths="IMAGE_WIDTHS"
          :sizes="IMAGE_SIZES"
          :priority="index === 0"
        />
      </figure>
    </div>

    <div class="home-landing__scrim" aria-hidden="true" />

    <div class="home-landing__copy">
      <p class="home-landing__brand">madd.lines</p>
      <p v-if="signature" class="home-landing__signature">{{ signature }}</p>
    </div>

    <div v-if="slides.length > 1" class="home-landing__dots" role="tablist" aria-label="slideshow">
      <button
        v-for="(slide, index) in slides"
        :key="`dot-${slide.key}`"
        type="button"
        class="home-landing__dot"
        :class="{ 'home-landing__dot--active': index === activeIndex }"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-label="`slide ${index + 1}`"
        @click="goToSlide(index)"
      />
    </div>

    <button
      type="button"
      class="home-landing__scroll"
      aria-label="scroll to portfolio"
      @click="scrollToNext"
    >
      <svg class="home-landing__scroll-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import SmartImage from '../media/SmartImage.vue';

const IMAGE_WIDTHS = [640, 960, 1200, 1400];
const IMAGE_SIZES = '100vw';
const SLIDE_INTERVAL_MS = 5500;

const props = defineProps({
  title: { type: String, default: '' },
  slideshowItems: {
    type: Array,
    default: () => []
  },
  /** @deprecated use slideshowItems */
  imageUrls: {
    type: Array,
    default: () => []
  }
});

const signature = computed(() => String(props.title || '').trim());

const slides = computed(() => {
  const fromItems = Array.isArray(props.slideshowItems) ? props.slideshowItems : [];
  if (fromItems.length) {
    return fromItems
      .map((item, index) => {
        const src = String(item?.src || item?.url || '').trim();
        if (!src) {
          return null;
        }
        const type = item?.type === 'video' ? 'video' : 'image';
        return {
          key: `${type}-${src}-${index}`,
          type,
          src,
          alt: index === 0 ? 'hero media' : `hero media ${index + 1}`
        };
      })
      .filter(Boolean);
  }

  return (Array.isArray(props.imageUrls) ? props.imageUrls : [])
    .map((url) => String(url || '').trim())
    .filter(Boolean)
    .map((src, index) => ({
      key: `image-${src}-${index}`,
      type: 'image',
      src,
      alt: index === 0 ? 'hero portrait' : `hero portrait ${index + 1}`
    }));
});

const activeIndex = ref(0);
const videoRefs = ref([]);
let slideTimer = null;

function setVideoRef(el, index) {
  if (el) {
    videoRefs.value[index] = el;
    return;
  }
  videoRefs.value[index] = null;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function syncVideoPlayback() {
  slides.value.forEach((slide, index) => {
    const el = videoRefs.value[index];
    if (!el || slide.type !== 'video') {
      return;
    }
    if (index === activeIndex.value) {
      el.currentTime = 0;
      const playPromise = el.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
      return;
    }
    el.pause();
  });
}

function goToSlide(index) {
  if (!slides.value.length) {
    return;
  }
  const normalized = ((index % slides.value.length) + slides.value.length) % slides.value.length;
  activeIndex.value = normalized;
  syncVideoPlayback();
  startSlideshow();
}

function advanceSlide() {
  if (slides.value.length < 2) {
    return;
  }
  goToSlide(activeIndex.value + 1);
}

function stopSlideshow() {
  if (slideTimer) {
    window.clearInterval(slideTimer);
    slideTimer = null;
  }
}

function startSlideshow() {
  stopSlideshow();
  if (slides.value.length < 2 || prefersReducedMotion()) {
    return;
  }

  const current = slides.value[activeIndex.value];
  if (current?.type === 'video') {
    return;
  }

  slideTimer = window.setInterval(advanceSlide, SLIDE_INTERVAL_MS);
}

function onVideoEnded(index) {
  if (index !== activeIndex.value || slides.value.length < 2 || prefersReducedMotion()) {
    return;
  }
  advanceSlide();
}

function scrollToNext() {
  const next = document.querySelector('.home-my-art');
  if (!next) {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    return;
  }

  const top = Math.round(next.getBoundingClientRect().top + window.scrollY);
  window.scrollTo({ top, behavior: 'smooth' });
}

watch(
  slides,
  (nextSlides) => {
    videoRefs.value = [];
    if (!nextSlides.length) {
      activeIndex.value = 0;
      stopSlideshow();
      return;
    }
    if (activeIndex.value >= nextSlides.length) {
      activeIndex.value = 0;
    }
    startSlideshow();
  },
  { immediate: true }
);

watch(activeIndex, () => {
  syncVideoPlayback();
});

onMounted(() => {
  syncVideoPlayback();
  startSlideshow();
});

onUnmounted(() => {
  stopSlideshow();
});
</script>

<style scoped>
.home-landing {
  --home-landing-height: 100svh;
  --home-landing-height: 100dvh;
  position: relative;
  width: 100%;
  height: var(--home-landing-height);
  min-height: var(--home-landing-height);
  max-height: var(--home-landing-height);
  box-sizing: border-box;
  padding: 0;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-paper);
  scroll-snap-align: start;
}

.home-landing__slides {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.home-landing__slide {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  transition: opacity 1s ease;
  overflow: hidden;
  background: var(--color-highlight);
}

.home-landing__slide--active {
  opacity: 1;
}

.home-landing__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: var(--color-highlight);
}

.home-landing__slide :deep(.smart-image.smart-image--fill) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.home-landing__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--color-text) 48%, transparent) 0%,
    color-mix(in srgb, var(--color-text) 20%, transparent) 42%,
    color-mix(in srgb, var(--color-text) 55%, transparent) 100%
  );
}

.home-landing__copy {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: clamp(0.75rem, 2vh, 1.25rem);
  padding: clamp(1.5rem, 4vh, 2.5rem) clamp(1.25rem, 4vw, 2.5rem);
  text-align: center;
  pointer-events: none;
  animation: home-landing-enter 0.9s ease-out both;
}

.home-landing__brand {
  margin: 0;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(2rem, 5.5vw, 4rem);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: 0.1em;
  color: var(--color-paper);
  text-shadow: 0 1px 24px color-mix(in srgb, var(--color-text) 35%, transparent);
}

.home-landing__signature {
  margin: 0;
  font-family: var(--font-script);
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 400;
  font-style: normal;
  line-height: 1.1;
  letter-spacing: 0.01em;
  color: var(--color-paper);
  opacity: 0.94;
  text-shadow: 0 1px 20px color-mix(in srgb, var(--color-text) 30%, transparent);
}

.home-landing__dots {
  position: absolute;
  left: 50%;
  bottom: max(4.25rem, env(safe-area-inset-bottom, 0px) + 3.75rem);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  transform: translateX(-50%);
}

.home-landing__dot {
  width: 0.45rem;
  height: 0.45rem;
  margin: 0;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color-paper) 65%, transparent);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.home-landing__dot--active {
  background: var(--color-paper);
  border-color: var(--color-paper);
  transform: scale(1.15);
}

.home-landing__dot:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1px var(--color-paper);
}

.home-landing__scroll {
  position: absolute;
  left: 50%;
  bottom: max(1rem, env(safe-area-inset-bottom, 0px) + 0.75rem);
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  margin: 0;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--color-paper) 70%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-text) 28%, transparent);
  color: var(--color-paper);
  cursor: pointer;
  transform: translateX(-50%);
  transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.home-landing__scroll:hover,
.home-landing__scroll:active {
  border-color: var(--color-paper);
  background: color-mix(in srgb, var(--color-text) 42%, transparent);
  transform: translateX(-50%) translateY(2px);
}

.home-landing__scroll:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1px var(--color-paper);
}

.home-landing__scroll-icon {
  display: block;
  width: 0.95rem;
  height: 0.95rem;
}

.home-landing__scroll-icon path {
  stroke-width: 1.35;
}

@keyframes home-landing-enter {
  from {
    opacity: 0;
    transform: translateY(0.6rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-landing__copy {
    animation: none;
  }

  .home-landing__slide {
    transition: none;
  }

  .home-landing__scroll,
  .home-landing__scroll:hover,
  .home-landing__scroll:active {
    transition: none;
    transform: translateX(-50%);
  }
}
</style>
