<template>
  <div class="gallery-page">
    <header class="gallery-header">
      <h1 class="page-hero-title gallery-header__title">{{ galleryPageTitle }}</h1>
    </header>

    <p v-if="loading" class="gallery-status">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!works.length" class="gallery-status">{{ galleryEmptyMessage }}</p>

    <template v-else>
      <section class="gallery-section" :aria-label="gallerySectionLabel">
        <div class="gallery-container mobile-safe-container">
          <div class="gallery-wall">
            <div class="product-grid product-grid--gallery">
              <GalleryPortfolioCard
                v-for="work in visibleWorks"
                :key="work._id"
                :work="work"
                @open="openWork"
              />
            </div>
          </div>

          <div v-if="hasMore" class="load-more-wrap">
            <button type="button" class="load-more-button" @click="loadMore">
              Load More
            </button>
          </div>
        </div>
      </section>
    </template>

    <ProductDetailOverlay
      v-if="overlaySlug"
      :slug="overlaySlug"
      :initial-product="overlayInitialWork"
      content-type="portfolio"
      :open="isOverlayOpen"
      @close="closeWork"
      @after-leave="onOverlayAfterLeave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPortfolio } from '../services/api.js';
import GalleryPortfolioCard from '../components/portfolio/GalleryPortfolioCard.vue';
import ProductDetailOverlay from '../components/product/ProductDetailOverlay.vue';
import { useStorefrontLabels } from '../composables/useStorefrontLabels.js';

const { galleryPageTitle, gallerySectionLabel, galleryEmptyMessage } = useStorefrontLabels();

const PAGE_SIZE = 8;

const route = useRoute();
const router = useRouter();

const works = ref([]);
const loading = ref(true);
const error = ref('');
const visibleCount = ref(PAGE_SIZE);
const overlaySlug = ref(null);

const visibleWorks = computed(() => works.value.slice(0, visibleCount.value));
const hasMore = computed(() => visibleCount.value < works.value.length);

const activeWorkSlug = computed(() => {
  const work = route.query.work;
  return typeof work === 'string' && work ? work : null;
});

const isOverlayOpen = computed(() => Boolean(activeWorkSlug.value));

const overlayInitialWork = computed(() => {
  if (!overlaySlug.value) {
    return null;
  }
  return works.value.find((w) => w.slug === overlaySlug.value) ?? null;
});

function expandVisibleCountForSlug(slug) {
  if (!slug) {
    return;
  }
  const index = works.value.findIndex((w) => w.slug === slug);
  if (index < 0 || index < visibleCount.value) {
    return;
  }
  visibleCount.value = Math.min(
    Math.ceil((index + 1) / PAGE_SIZE) * PAGE_SIZE,
    works.value.length
  );
}

watch(
  activeWorkSlug,
  (slug) => {
    if (slug) {
      overlaySlug.value = slug;
      expandVisibleCountForSlug(slug);
    }
  },
  { immediate: true }
);

function openWork(slug) {
  router.push({
    name: 'gallery',
    query: { work: slug },
    state: { portfolioOverlayOpened: true }
  });
}

function closeWork() {
  if (!route.query.work) {
    return;
  }
  if (window.history.state?.portfolioOverlayOpened) {
    router.back();
    return;
  }
  router.replace({ name: 'gallery' });
}

function onOverlayAfterLeave() {
  if (!activeWorkSlug.value) {
    overlaySlug.value = null;
  }
}

function loadMore() {
  visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, works.value.length);
}

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    const list = await getPortfolio();
    works.value = Array.isArray(list) ? list : [];
    visibleCount.value = Math.min(PAGE_SIZE, works.value.length || PAGE_SIZE);
    expandVisibleCountForSlug(activeWorkSlug.value);
  } catch (e) {
    error.value = e.message || 'Failed to load gallery';
  } finally {
    loading.value = false;
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

.gallery-wall {
  width: 100%;
  container-type: inline-size;
  container-name: gallery-wall;
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
  background: var(--color-highlight);
  color: var(--color-text);
  border: 1px solid var(--color-accent);
  border-radius: 0;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: none;
}

.load-more-button:hover:not(:disabled) {
  background: var(--color-accent);
  color: var(--color-highlight);
  opacity: 1;
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
