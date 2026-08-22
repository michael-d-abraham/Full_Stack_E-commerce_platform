<template>
  <HomeMarqueeSection
    aria-label="client reviews"
    section-class="home-testimonials"
    :items="items"
    :background-image-url="backgroundImageUrl"
  />
</template>

<script setup>
import { computed } from 'vue';
import HomeMarqueeSection from './HomeMarqueeSection.vue';
import { PLACEHOLDER_TESTIMONIALS } from '../../constants/testimonials.js';

defineProps({
  backgroundImageUrl: {
    type: String,
    default: ''
  }
});

const items = computed(() =>
  PLACEHOLDER_TESTIMONIALS.map((item) => ({
    ...item,
    variant: 'quote'
  }))
);
</script>
