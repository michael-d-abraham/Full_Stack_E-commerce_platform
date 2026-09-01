<template>
  <div class="home-page">
    <PageReveal :ready="ready">
      <template #skeleton>
        <div class="home-page__skeleton" aria-hidden="true">
          <div class="skeleton-stack home-page__skeleton-landing">
            <Skeleton variant="title" width="55%" />
            <Skeleton variant="title" width="40%" />
            <Skeleton variant="card" height="42vh" />
          </div>
          <div class="home-page__skeleton-marquee">
            <Skeleton v-for="n in 3" :key="n" variant="card" height="12rem" />
          </div>
        </div>
      </template>

      <p v-if="error" class="error home-page__status">{{ error }}</p>
      <template v-else-if="content">
        <HomeLanding
          :title="content.hero_title"
          :slideshow-items="heroSlideshowItems"
        />
        <HomeMyArtSection />
      </template>
    </PageReveal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { getPublicHomePage } from '../services/api.js';
import { createSwrCache } from '../composables/createSwrCache.js';
import HomeLanding from '../components/home/HomeLanding.vue';
import HomeMyArtSection from '../components/home/HomeMyArtSection.vue';
import { resolveHeroSlideshowItems } from '@shared/homePageDefaults.js';
import { PLACEHOLDER_ARTWORK } from '../constants/artworkPlaceholders.js';
import PageReveal from '../components/loading/PageReveal.vue';
import Skeleton from '../components/loading/Skeleton.vue';
import { prefetchRouteChunks } from '../utils/routePrefetch.js';
import { usePublicPortfolio } from '../composables/usePublicPortfolio.js';
import {
  refreshStorefrontSectionObserver,
  scrollToStorefrontSection
} from '../composables/useStorefrontSectionNav.js';

const HOME_STORAGE_KEY = 'artist-portfolio-home-page';
const homeCache = createSwrCache({
  storageKey: HOME_STORAGE_KEY,
  storage: typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  ttlMs: 1000 * 60 * 10
});

const route = useRoute();
const content = ref(homeCache.getCached());
const error = ref('');
const { ensurePortfolio } = usePublicPortfolio();

const ready = computed(() => Boolean(content.value) || Boolean(error.value));

const heroSlideshowItems = computed(() => {
  const saved = resolveHeroSlideshowItems(content.value || {});
  if (saved.length) {
    return saved;
  }
  return PLACEHOLDER_ARTWORK.slice(0, 3).map((item) => ({
    type: 'image',
    src: item.src
  }));
});

function scrollToHash() {
  const id = String(route.hash || '').replace(/^#/, '');
  if (!id) {
    return;
  }
  nextTick(() => {
    requestAnimationFrame(() => {
      refreshStorefrontSectionObserver();
      scrollToStorefrontSection(id);
    });
  });
}

watch(
  ready,
  (isReady) => {
    if (!isReady) {
      return;
    }
    nextTick(() => {
      refreshStorefrontSectionObserver();
      scrollToHash();
    });
  },
  { immediate: true }
);

watch(
  () => route.hash,
  () => {
    if (ready.value) {
      scrollToHash();
    }
  }
);

onMounted(async () => {
  error.value = '';
  prefetchRouteChunks(['gallery', 'product']);
  ensurePortfolio();
  try {
    const homeData = await homeCache.ensure(() => getPublicHomePage(), {
      onUpdate(data) {
        content.value = data;
      }
    });
    content.value = homeData;
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
  overflow-x: hidden;
  scroll-snap-type: y proximity;
}

.home-page__skeleton-landing {
  min-height: 100dvh;
  justify-content: center;
  gap: 1rem;
}

.home-page__status {
  text-align: center;
  color: var(--color-text-muted);
  margin: var(--space-xl) 0;
}

.home-page__skeleton {
  padding: var(--space-lg) var(--space-md);
}

.home-page__skeleton-marquee {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  overflow: hidden;
}

.home-page__skeleton-marquee :deep(.skeleton) {
  flex: 0 0 min(85vw, 320px);
  min-width: 200px;
}
</style>
