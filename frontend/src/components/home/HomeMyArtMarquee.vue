<template>
  <HomeMarqueeSection
    v-if="items.length"
    embedded
    :show-fade="false"
    aria-label="artwork and client reviews"
    section-class="home-my-art-marquee"
    :items="items"
  />
</template>

<script setup>
import { computed, onMounted } from 'vue';
import HomeMarqueeSection from './HomeMarqueeSection.vue';
import { usePublicPortfolio } from '../../composables/usePublicPortfolio.js';
import { PLACEHOLDER_ARTWORK } from '../../constants/artworkPlaceholders.js';
import { PLACEHOLDER_TESTIMONIALS } from '../../constants/testimonials.js';
import { resolveArtworkMarqueeItems } from '../../utils/artworkMarqueeItems.js';
import { pairMarqueeItems } from '../../utils/pairMarqueeItems.js';

const { works, ensurePortfolio } = usePublicPortfolio();

const items = computed(() => {
  const images = resolveArtworkMarqueeItems(works.value, PLACEHOLDER_ARTWORK);
  const quotes = PLACEHOLDER_TESTIMONIALS;

  return pairMarqueeItems(images, quotes);
});

onMounted(() => {
  ensurePortfolio();
});
</script>
