<template>
  <section
    ref="sectionRef"
    id="about-me"
    class="home-about-me home-section"
    aria-labelledby="home-about-me-heading"
  >
    <div class="home-placeholder__container mobile-safe-container">
      <header class="home-placeholder__masthead">
        <h2 id="home-about-me-heading" class="home-placeholder__title">about me</h2>
        <div class="home-placeholder__divider" aria-hidden="true" />
      </header>
      <p class="home-placeholder__copy">{{ copy }}</p>
    </div>

    <div class="home-about-me__pair">
      <div class="home-about-me__col">
        <div ref="leftShiftRef" class="home-about-me__shift">
          <SmartImage
            :src="leftSrc"
            :alt="leftAlt"
            layout="fill"
            object-fit="cover"
            :width="1200"
            :widths="IMAGE_WIDTHS"
            :sizes="IMAGE_SIZES"
            :priority="true"
          />
        </div>
      </div>
      <div class="home-about-me__col">
        <div ref="rightShiftRef" class="home-about-me__shift">
          <SmartImage
            :src="rightSrc"
            :alt="rightAlt"
            layout="fill"
            object-fit="cover"
            :width="1200"
            :widths="IMAGE_WIDTHS"
            :sizes="IMAGE_SIZES"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import SmartImage from '../media/SmartImage.vue';
import { useScrollParallax } from '../../composables/useScrollParallax.js';

const IMAGE_WIDTHS = [480, 720, 960, 1200];
const IMAGE_SIZES = '(max-width: 640px) 50vw, 46vw';

const props = defineProps({
  copy: {
    type: String,
    required: true
  },
  leftSrc: {
    type: String,
    required: true
  },
  rightSrc: {
    type: String,
    required: true
  },
  leftAlt: {
    type: String,
    default: 'studio portrait'
  },
  rightAlt: {
    type: String,
    default: 'studio work'
  }
});

const sectionRef = ref(null);
const leftShiftRef = ref(null);
const rightShiftRef = ref(null);
const enabled = computed(() => Boolean(props.leftSrc && props.rightSrc));

useScrollParallax(sectionRef, leftShiftRef, enabled, {
  axis: 'y',
  desktop: 0.1,
  mobile: 0.06
});

useScrollParallax(sectionRef, rightShiftRef, enabled, {
  axis: 'y',
  desktop: 0.22,
  mobile: 0.14
});
</script>

<style scoped>
.home-about-me {
  width: 100%;
  padding-bottom: var(--space-2xl);
}

.home-about-me__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(0.5rem, 1.4vw, 1rem);
  width: 100%;
  height: 88vh;
  min-height: 28rem;
  margin-top: var(--space-xl);
}

.home-about-me__col {
  position: relative;
  overflow: hidden;
  height: 100%;
  min-width: 0;
  background: var(--color-highlight);
}

.home-about-me__shift {
  position: absolute;
  inset: -18% 0;
  width: 100%;
  height: 136%;
  will-change: transform;
}

.home-about-me__shift :deep(.smart-image.smart-image--fill) {
  width: 100%;
  height: 100%;
}

@media (max-width: 640px) {
  .home-about-me {
    padding-bottom: var(--space-xl);
  }

  .home-about-me__pair {
    height: 78vh;
    min-height: 22rem;
    margin-top: var(--space-lg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-about-me__shift {
    inset: 0;
    height: 100%;
    will-change: auto;
  }
}
</style>
