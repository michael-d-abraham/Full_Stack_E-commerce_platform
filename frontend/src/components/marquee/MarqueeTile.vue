<template>
  <figure
    ref="figureRef"
    class="marquee-tile"
    :class="{
      'marquee-tile--image': isImage,
      'marquee-tile--spotlight-active': spotlightActive
    }"
    :style="spotlightVars"
    tabindex="0"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @focus="onFocus"
    @blur="onBlur"
  >
    <div class="marquee-tile__spotlight" aria-hidden="true" />

    <div v-if="isImage" class="marquee-tile__media">
      <SmartImage
        :src="src"
        :alt="alt"
        layout="fill"
        object-fit="cover"
        :width="960"
        :widths="IMAGE_WIDTHS"
        :sizes="IMAGE_SIZES"
        :priority="priority"
        :fade-in="false"
      />
    </div>

    <div v-else class="marquee-tile__inner">
      <img
        class="marquee-tile__avatar"
        :src="avatarUrl"
        alt=""
        width="44"
        height="44"
        loading="lazy"
        decoding="async"
      >
      <blockquote class="marquee-tile__quote">
        {{ quote }}
      </blockquote>
      <footer class="marquee-tile__footer">
        <cite class="marquee-tile__name">{{ name }}</cite>
        <p class="marquee-tile__role">{{ role }}</p>
      </footer>
    </div>
  </figure>
</template>

<script setup>
import { computed } from 'vue';
import SmartImage from '../media/SmartImage.vue';
import { useCardSpotlight } from '../../composables/useCardSpotlight.js';

const IMAGE_WIDTHS = [240, 400, 640, 960];
const IMAGE_SIZES = '(max-width: 640px) 85vw, 360px';

const props = defineProps({
  variant: {
    type: String,
    default: 'quote',
    validator: (value) => value === 'quote' || value === 'image'
  },
  quote: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  priority: {
    type: Boolean,
    default: false
  }
});

const isImage = computed(() => props.variant === 'image');

const {
  figureRef,
  spotlightActive,
  spotlightVars,
  onMouseMove,
  onMouseLeave,
  onFocus,
  onBlur
} = useCardSpotlight();
</script>
