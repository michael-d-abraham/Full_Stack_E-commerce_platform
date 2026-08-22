<template>
  <div class="home-page">
    <PageReveal :ready="ready">
      <template #skeleton>
        <div class="home-page__skeleton" aria-hidden="true">
          <div class="skeleton-stack">
            <Skeleton variant="title" width="70%" />
            <Skeleton variant="title" width="55%" />
            <div class="home-page__skeleton-marquee">
              <Skeleton v-for="n in 3" :key="n" variant="card" height="12rem" />
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
        <HomeAboutSection
          :section-title="content.about_title"
          :header="content.about_header"
          :text="content.about_text"
          :image-url="content.about_image_url"
          :background-image-url="content.about_background_image_url"
        />
        <HomeTestimonialMarquee
          :background-image-url="content.featured_background_image_url"
        />
      </template>
    </PageReveal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getPublicHomePage } from '../services/api.js';
import { createSwrCache } from '../composables/createSwrCache.js';
import HomeHero from '../components/home/HomeHero.vue';
import HomeTestimonialMarquee from '../components/home/HomeTestimonialMarquee.vue';
import HomeAboutSection from '../components/home/HomeAboutSection.vue';
import PageReveal from '../components/loading/PageReveal.vue';
import Skeleton from '../components/loading/Skeleton.vue';
import { prefetchRouteChunks } from '../utils/routePrefetch.js';

const HOME_STORAGE_KEY = 'artist-portfolio-home-page';
const homeCache = createSwrCache({
  storageKey: HOME_STORAGE_KEY,
  storage: typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  ttlMs: 1000 * 60 * 10
});

const content = ref(homeCache.getCached());
const error = ref('');

const ready = computed(() => Boolean(content.value) || Boolean(error.value));

onMounted(async () => {
  error.value = '';
  prefetchRouteChunks(['gallery', 'product']);
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
