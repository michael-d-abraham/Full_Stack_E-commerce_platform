<template>
  <article class="product-card product-card--linkable">
    <button
      type="button"
      class="product-card-link gallery-art-presentation"
      :aria-label="`${portfolioTitle(work)} — view work`"
      @click="emit('open', work.slug)"
    >
      <GalleryArtFrame
        :src="primaryPortfolioImageUrl(work)"
        :alt="thumbAlt(work)"
      />
      <div v-if="showTitle" class="product-info gallery-product-meta gallery-plaque gallery-plaque-typography">
        <h3 class="product-title gallery-product-title">{{ portfolioTitle(work) }}</h3>
      </div>
    </button>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import GalleryArtFrame from '../product/GalleryArtFrame.vue';
import {
  primaryPortfolioImageUrl,
  portfolioTitle
} from '../../utils/portfolioDisplay.js';

const props = defineProps({
  work: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['open']);

const showTitle = computed(() => Boolean(String(props.work?.title || '').trim()));

function thumbAlt(work) {
  const primary =
    work?.portfolio_images?.find((i) => i?.is_primary) || work?.portfolio_images?.[0];
  return primary?.alt_text || portfolioTitle(work);
}
</script>
