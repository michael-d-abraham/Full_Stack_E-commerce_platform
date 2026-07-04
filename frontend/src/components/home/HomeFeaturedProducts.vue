<template>
  <section class="home-featured" aria-labelledby="home-featured-heading">
    <div class="home-featured__container mobile-safe-container">
      <h2 id="home-featured-heading" class="home-featured__title page-hero-title">
        {{ sectionTitle }}
      </h2>

      <Transition name="gallery-content-reveal" mode="out-in">
        <ProductGridLoadingScreen
          v-if="!contentReady"
          key="featured-loading"
          variant="section"
          message="Preparing gallery…"
          :skeleton-count="skeletonCount"
        />
        <div
          v-else
          key="featured-content"
          class="product-grid product-grid--gallery"
        >
          <GalleryProductCard
            v-for="(p, index) in visibleProducts"
            :key="p._id"
            :product="p"
            :show-add-to-cart="false"
            :image-loading="index < preloadCount ? 'eager' : 'lazy'"
          />
        </div>
      </Transition>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useInitialImagePreload } from '../../composables/useInitialImagePreload.js';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import GalleryProductCard from '../product/GalleryProductCard.vue';
import ProductGridLoadingScreen from '../product/ProductGridLoadingScreen.vue';

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

const { imagesReady, preloadCount } = useInitialImagePreload(visibleProducts);
const contentReady = computed(() => imagesReady.value);
const skeletonCount = computed(() => (isMobile.value ? 2 : 3));
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

.gallery-content-reveal-enter-active,
.gallery-content-reveal-leave-active {
  transition: opacity 360ms ease;
}

.gallery-content-reveal-enter-from,
.gallery-content-reveal-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .gallery-content-reveal-enter-active,
  .gallery-content-reveal-leave-active {
    transition: none;
  }
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
    padding: var(--space-lg) 0 var(--space-2xl);
  }

  .home-featured__container {
    padding-left: 0;
    padding-right: 0;
  }

  .home-featured__title {
    margin-bottom: var(--space-lg);
  }
}

/* Touch devices: press feedback + view overlay on tap */
@media (hover: none) and (pointer: coarse) {
  .home-featured :deep(.product-card-link:active .gallery-art-frame) {
    transform: scale(0.98);
  }
}
</style>
