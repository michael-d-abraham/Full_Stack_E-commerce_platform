<template>
  <section class="home-featured" aria-labelledby="home-featured-heading">
    <div class="home-featured__container mobile-safe-container">
      <h2 id="home-featured-heading" class="home-featured__title page-hero-title">
        {{ sectionTitle }}
      </h2>
      <div class="product-grid product-grid--gallery">
        <GalleryProductCard
          v-for="p in visibleProducts"
          :key="p._id"
          :product="p"
          :show-add-to-cart="false"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import GalleryProductCard from '../product/GalleryProductCard.vue';

const MOBILE_MQ = '(max-width: 640px)';

const props = defineProps({
  sectionTitle: { type: String, required: true },
  products: {
    type: Array,
    required: true
  }
});

const isMobile = useMediaQuery(MOBILE_MQ);

const visibleProducts = computed(() =>
  isMobile.value ? props.products.slice(0, 3) : props.products
);
</script>

<style scoped>
.home-featured {
  width: 100%;
  padding: var(--space-md) 0 var(--space-3xl);
  background: var(--color-bg);
}

.home-featured__container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px;
}

.home-featured__title {
  margin: 0 0 2.5rem;
  text-align: center;
}

@media (min-width: 641px) {
  .home-featured {
    padding-top: var(--space-lg);
  }

  .home-featured__title {
    margin-top: 0;
  }
}

@media (max-width: 640px) {
  .home-featured {
    padding: 0 0 var(--space-2xl);
  }

  .home-featured__container {
    padding-left: 0;
    padding-right: 0;
  }

  .home-featured__title {
    margin-bottom: var(--space-lg);
  }
}
</style>
