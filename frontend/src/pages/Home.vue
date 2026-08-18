<template>
  <div class="home-page">
    <PageReveal :ready="ready">
      <template #skeleton>
        <div class="home-page__skeleton" aria-hidden="true">
          <div class="skeleton-stack">
            <Skeleton variant="title" width="70%" />
            <Skeleton variant="title" width="55%" />
            <Skeleton variant="text" width="20%" />
            <div class="home-page__skeleton-grid">
              <Skeleton v-for="n in 3" :key="n" variant="card" height="16rem" />
            </div>
          </div>
        </div>
      </template>

      <p v-if="error" class="error home-page__status">{{ error }}</p>
      <template v-else-if="content">
        <HomeHero
          :quote="content.hero_quote"
          :title="content.hero_title"
        />
        <HomeFeaturedProducts
          v-if="featuredProducts.length"
          :section-title="content.featured_title"
          :background-image-url="content.featured_background_image_url"
          :products="featuredProducts"
        />
        <HomeAboutSection
          :section-title="content.about_title"
          :header="content.about_header"
          :text="content.about_text"
          :image-url="content.about_image_url"
          :background-image-url="content.about_background_image_url"
        />
      </template>
    </PageReveal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getPublicHomePage } from '../services/api.js';
import { createSwrCache } from '../composables/createSwrCache.js';
import {
  ensureProductsList,
  getCachedProductsList,
  seedProductCache
} from '../composables/useProductCache.js';
import HomeHero from '../components/home/HomeHero.vue';
import HomeFeaturedProducts from '../components/home/HomeFeaturedProducts.vue';
import HomeAboutSection from '../components/home/HomeAboutSection.vue';
import PageReveal from '../components/loading/PageReveal.vue';
import Skeleton from '../components/loading/Skeleton.vue';
import { prefetchRouteChunks } from '../utils/routePrefetch.js';
import { applyHomePageDefaults } from '../constants/homePageDefaults.js';

const HOME_STORAGE_KEY = 'madd-lines-home-page';
const homeCache = createSwrCache({
  storageKey: HOME_STORAGE_KEY,
  storage: typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  ttlMs: 1000 * 60 * 10
});

const content = ref(applyHomePageDefaults(homeCache.getCached()));
const catalogProducts = ref(getCachedProductsList() || []);
const error = ref('');

const ready = computed(() => Boolean(content.value) || Boolean(error.value));

const featuredProducts = computed(() => {
  if (!content.value?.featured_products?.length || !catalogProducts.value.length) {
    return [];
  }
  const byId = new Map(catalogProducts.value.map((p) => [String(p._id), p]));
  return content.value.featured_products
    .map((slot) => (slot.product_id ? byId.get(String(slot.product_id)) : null))
    .filter(Boolean);
});

onMounted(async () => {
  error.value = '';
  prefetchRouteChunks(['gallery', 'product']);
  try {
    const [homeData, products] = await Promise.all([
      homeCache.ensure(() => getPublicHomePage(), {
        onUpdate(data) {
          content.value = applyHomePageDefaults(data);
        }
      }),
      ensureProductsList({
        onUpdate(list) {
          catalogProducts.value = list;
        }
      })
    ]);
    content.value = applyHomePageDefaults(homeData);
    catalogProducts.value = Array.isArray(products) ? products : [];
    seedProductCache(catalogProducts.value, { prefetchImages: false });
    if (featuredProducts.value.length) {
      seedProductCache(featuredProducts.value, {
        prefetchImages: true,
        updateListCache: false
      });
    }
  } catch (e) {
    if (!content.value) {
      error.value = e.message || 'Failed to load home page';
    }
  }
});
</script>

<style scoped>
.home-page {
  width: 100%;
  margin: 0;
  padding: 0;
}

.home-page__status {
  text-align: center;
  color: var(--color-text-muted);
  margin: var(--space-xl) 0;
}

.home-page__skeleton {
  padding: var(--space-lg) var(--space-md);
}

.home-page__skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .home-page__skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>
