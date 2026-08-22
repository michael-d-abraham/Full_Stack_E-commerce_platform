<template>
  <HomeMarqueeSection
    v-if="items.length"
    section-id="gallery"
    aria-label="tattoo artwork"
    section-class="home-artwork"
    :items="items"
    :background-image-url="backgroundImageUrl"
  />
</template>

<script setup>
import { computed, onMounted } from 'vue';
import HomeMarqueeSection from './HomeMarqueeSection.vue';
import { usePublicPortfolio } from '../../composables/usePublicPortfolio.js';
import { PLACEHOLDER_ARTWORK } from '../../constants/artworkPlaceholders.js';
import { resolveArtworkMarqueeItems } from '../../utils/artworkMarqueeItems.js';

defineProps({
  backgroundImageUrl: {
    type: String,
    default: ''
  }
});

const { works, ensurePortfolio } = usePublicPortfolio();

const items = computed(() =>
  resolveArtworkMarqueeItems(works.value, PLACEHOLDER_ARTWORK).map((item) => ({
    ...item,
    variant: 'image'
  }))
);

onMounted(() => {
  ensurePortfolio();
});
</script>
