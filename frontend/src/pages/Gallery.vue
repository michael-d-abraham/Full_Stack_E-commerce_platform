<template>
  <div class="gallery-page">
    <header class="gallery-header">
      <h1 class="page-hero-title gallery-header__title">Gallery</h1>
    </header>

    <p v-if="error" class="error gallery-status">{{ error }}</p>
    <p v-else-if="showEmptyState" class="gallery-status">No products yet.</p>

    <Transition v-else name="gallery-content-reveal" mode="out-in">
      <ProductGridLoadingScreen
        v-if="!contentReady"
        key="gallery-loading"
        variant="page"
        :skeleton-count="skeletonCount"
      />
      <section
        v-else
        key="gallery-content"
        class="gallery-section"
        aria-label="Product gallery"
      >
        <div class="gallery-container mobile-safe-container">
          <div class="product-grid product-grid--gallery">
            <GalleryProductCard
              v-for="(p, index) in visibleProducts"
              :key="p._id"
              :product="p"
              :show-add-to-cart="false"
              :image-loading="index < preloadCount ? 'eager' : 'lazy'"
              navigation-mode="emit"
              @open="openProduct"
            />
          </div>

          <div v-if="hasMore" class="load-more-wrap">
            <button type="button" class="load-more-button" @click="loadMore">
              Load More
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <ProductDetailOverlay
      v-if="activeProductSlug"
      :slug="activeProductSlug"
      :initial-product="activeInitialProduct"
      @close="closeProduct"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProducts } from '../services/api.js';
import { useInitialImagePreload } from '../composables/useInitialImagePreload.js';
import GalleryProductCard from '../components/product/GalleryProductCard.vue';
import ProductDetailOverlay from '../components/product/ProductDetailOverlay.vue';
import ProductGridLoadingScreen from '../components/product/ProductGridLoadingScreen.vue';

const PAGE_SIZE = 8;

const route = useRoute();
const router = useRouter();

const products = ref([]);
const fetchLoading = ref(true);
const error = ref('');
const visibleCount = ref(PAGE_SIZE);

const visibleProducts = computed(() => products.value.slice(0, visibleCount.value));
const hasMore = computed(() => visibleCount.value < products.value.length);

const { imagesReady, preloadCount, isMobile } = useInitialImagePreload(products, {
  enabled: computed(() => !fetchLoading.value && !error.value && products.value.length > 0)
});

const contentReady = computed(() => !fetchLoading.value && imagesReady.value);
const showEmptyState = computed(
  () => contentReady.value && !error.value && !products.value.length
);
const skeletonCount = computed(() => (isMobile.value ? 2 : 3));

// Future prev/next in overlay: pass visibleProducts (or products) slugs into
// ProductDetailOverlay and navigate with router.push({ query: { product: nextSlug } }).

const activeProductSlug = computed(() => {
  const product = route.query.product;
  return typeof product === 'string' && product ? product : null;
});

const activeInitialProduct = computed(() => {
  if (!activeProductSlug.value) {
    return null;
  }
  return products.value.find((p) => p.slug === activeProductSlug.value) ?? null;
});

function openProduct(slug) {
  router.push({ name: 'gallery', query: { product: slug } });
}

function closeProduct() {
  if (window.history.state?.back != null) {
    router.back();
    return;
  }
  router.replace({ name: 'gallery' });
}

function loadMore() {
  visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, products.value.length);
}

onMounted(async () => {
  fetchLoading.value = true;
  error.value = '';
  try {
    products.value = await getProducts();
    visibleCount.value = Math.min(PAGE_SIZE, products.value.length || PAGE_SIZE);
  } catch (e) {
    error.value = e.message || 'Failed to load products';
  } finally {
    fetchLoading.value = false;
  }
});
</script>

<style scoped>
.gallery-page {
  width: 100%;
  min-height: 100%;
  margin-top: -0.75rem;
  padding-bottom: 56px;
}

.gallery-header {
  text-align: center;
  padding: 0 32px;
  margin: 0 auto 2.5rem;
  max-width: 900px;
}

.gallery-header__title {
  margin: 0;
}

.gallery-status {
  color: var(--color-text-muted);
  margin: 0;
  text-align: center;
  font-weight: 300;
}

.gallery-section {
  width: 100%;
  background: transparent;
  padding: 0;
}

.gallery-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px;
  background: transparent;
}

.load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

.load-more-button {
  min-width: 11rem;
  height: 40px;
  padding: 0 1.5rem;
  background: #fff;
  color: #000;
  border: 1px solid #000;
  border-radius: 0;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: none;
}

.load-more-button:hover:not(:disabled) {
  background: #000;
  color: #fff;
  opacity: 1;
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

@media (max-width: 640px) {
  .gallery-header {
    margin-bottom: 1.75rem;
    padding: 0 var(--mobile-safe-inset-x, 20px);
  }

  .gallery-section {
    padding: 0;
  }

  .gallery-page {
    padding-bottom: 48px;
  }

  .gallery-container {
    max-width: 100%;
    margin: 0;
    padding-left: 0;
    padding-right: 0;
  }

  .load-more-wrap {
    margin-top: 40px;
  }

  .load-more-button {
    width: 100%;
    max-width: 320px;
    min-height: 44px;
    height: 44px;
  }
}

</style>
