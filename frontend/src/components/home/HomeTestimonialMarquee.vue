<template>
  <HomeMarqueeSection
    aria-label="client reviews"
    section-class="home-testimonials"
    :items="items"
  />
</template>

<script setup>
import { computed } from 'vue';
import HomeMarqueeSection from './HomeMarqueeSection.vue';
import { PLACEHOLDER_TESTIMONIALS } from '../../constants/testimonials.js';

const items = computed(() =>
  PLACEHOLDER_TESTIMONIALS.map((item) => ({
    ...item,
    variant: 'quote'
  }))
);
</script>
