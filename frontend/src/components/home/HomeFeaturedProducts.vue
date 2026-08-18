<template>
  <section
    class="home-featured home-section"
    :class="{ 'home-section--has-background': Boolean(backgroundImageUrl) }"
    aria-labelledby="home-featured-heading"
  >
    <div
      v-if="backgroundImageUrl"
      class="home-featured__background home-section__background"
      :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
      aria-hidden="true"
    />
    <div class="home-featured__container mobile-safe-container">
      <h2 id="home-featured-heading" class="home-featured__title page-hero-title">
        {{ sectionTitle }}
      </h2>
      <div class="home-featured__grid-wrap">
        <div class="product-grid product-grid--gallery home-featured__grid">
          <GalleryProductCard
            v-for="p in visibleProducts"
            :key="p._id"
            :product="p"
            :show-add-to-cart="false"
          />
        </div>
      </div>
      <p class="home-featured__cta">
        <router-link to="/wanna-dos" class="home-featured__cta-link">
          View Collection
        </router-link>
      </p>
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
  backgroundImageUrl: { type: String, default: '' },
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
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: var(--space-md) 0 var(--space-3xl);
  background: var(--color-bg);
}

.home-featured__container {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px;
}

.home-featured__title {
  margin: 0 0 2.5rem;
  text-align: center;
}

.home-featured__grid-wrap {
  width: 100%;
  container-type: inline-size;
  container-name: gallery-wall;
}

.home-featured__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--space-xl) 0 0;
  padding: 0;
  width: 100%;
  text-align: center;
  line-height: normal;
}

.home-featured__cta-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50vw;
  max-width: 100%;
  min-width: 0;
  min-height: 64px;
  padding: 0 3rem;
  border: 1px solid var(--color-text);
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  box-shadow: none;
  box-sizing: border-box;
  transition: background 0.2s ease, color 0.2s ease;
}

.home-featured__cta-link:hover {
  background: var(--color-text);
  color: var(--color-bg);
  opacity: 1;
  text-decoration: none;
}

.home-featured__cta-link:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

@media (min-width: 641px) {
  .home-featured {
    padding-top: var(--space-lg);
  }

  .home-featured__title {
    margin-top: 0;
  }

  .home-featured__container {
    max-width: min(90vw, 75rem);
    padding: 0 clamp(1rem, 2vw, 2rem);
  }

  .home-featured__grid.product-grid--gallery {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    columns: auto;
    width: 100%;
    max-width: none;
    gap: clamp(2rem, 4vw, 3rem) clamp(1.25rem, 2.5vw, 2rem);
    --gallery-column-count: 3;
    --gallery-column-gap-value: clamp(1.25rem, 2.5vw, 2rem);
    --gallery-track-width: calc(
      (100% - (var(--gallery-column-count) - 1) * var(--gallery-column-gap-value))
        / var(--gallery-column-count)
    );
  }

  .home-featured__grid.product-grid--gallery .product-card {
    margin: 0;
    break-inside: auto;
    -webkit-column-break-inside: auto;
    page-break-inside: auto;
  }
}

@media (max-width: 640px) {
  .home-featured {
    padding: var(--space-xl) 0 var(--space-2xl);
  }

  .home-featured__container {
    padding-left: 0;
    padding-right: 0;
  }

  .home-featured__title {
    margin-bottom: var(--space-lg);
  }

  .home-featured__cta {
    margin-top: var(--space-lg);
  }
}

/* Stronger tap / click affordance for home featured cards */
.home-featured :deep(.product-card-link) {
  position: relative;
  border-radius: 2px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 160ms ease;
}

.home-featured :deep(.product-card-link::after) {
  content: 'View piece →';
  display: block;
  margin-top: 0.65rem;
  font-family: var(--gallery-meta-font, var(--font-sans));
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  transition: color 160ms ease, opacity 160ms ease;
}

.home-featured :deep(.product-card-link:hover::after),
.home-featured :deep(.product-card-link:focus-visible::after) {
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 0.3em;
}

.home-featured :deep(.product-card-link:hover .gallery-art-frame),
.home-featured :deep(.product-card-link:focus-visible .gallery-art-frame) {
  transform: translateY(-4px);
  box-shadow: var(--gallery-frame-shadow-hover), var(--gallery-frame-inset);
}

.home-featured :deep(.product-card-link:active) {
  transform: scale(0.985);
}

.home-featured :deep(.product-card-link:active .gallery-art-frame) {
  transform: translateY(-1px);
  box-shadow: var(--gallery-frame-shadow-hover), var(--gallery-frame-inset);
}

.home-featured :deep(.product-card-link:active::after) {
  color: var(--color-text);
}

@media (prefers-reduced-motion: reduce) {
  .home-featured :deep(.product-card-link) {
    transition: none;
  }

  .home-featured :deep(.product-card-link:active) {
    transform: none;
  }

  .home-featured :deep(.product-card-link:hover .gallery-art-frame),
  .home-featured :deep(.product-card-link:focus-visible .gallery-art-frame),
  .home-featured :deep(.product-card-link:active .gallery-art-frame) {
    transform: none;
    box-shadow: var(--gallery-frame-shadow), var(--gallery-frame-inset);
  }
}
</style>
