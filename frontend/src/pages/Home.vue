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
          quote="madd"
          :title="content.hero_title"
          :image-url="heroImageUrl"
        />
        <HomeHero
          quote=".lines"
          :title="content.hero_title"
          :image-url="heroLinesImageUrl"
          reversed
          section-id="landing-echo"
        />
        <HomeAboutMeSection
          copy="a short artist bio will live here — studio story, process, and the work behind the work."
          :left-src="aboutMeImages.left"
          :right-src="aboutMeImages.right"
        />
        <HomePlaceholderSection
          title="my art"
          section-id="my-art"
          heading-id="home-my-art-heading"
          section-class="home-my-art"
          copy="this section will hold a closer look at style, process, and selected pieces."
          show-media
          cta-to="/gallery"
          cta-label="view gallery"
        />
        <HomeArtworkMarquee />
        <HomePlaceholderSection
          title="wanna do’s"
          section-id="wanna-dos"
          heading-id="home-wanna-dos-heading"
          section-class="home-wanna-dos"
          copy="flash and available designs will appear here — pieces ready to claim."
          show-media
          cta-to="/wanna-dos"
          cta-label="see wanna do’s"
        />
        <HomeTestimonialMarquee />
      </template>
    </PageReveal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { getPublicHomePage } from '../services/api.js';
import { createSwrCache } from '../composables/createSwrCache.js';
import HomeHero from '../components/home/HomeHero.vue';
import HomeArtworkMarquee from '../components/home/HomeArtworkMarquee.vue';
import HomeTestimonialMarquee from '../components/home/HomeTestimonialMarquee.vue';
import HomeAboutMeSection from '../components/home/HomeAboutMeSection.vue';
import HomePlaceholderSection from '../components/home/HomePlaceholderSection.vue';
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

const heroImageUrl = computed(() => {
  const saved = content.value?.hero_image_url
    ? String(content.value.hero_image_url).trim()
    : '';
  return saved || PLACEHOLDER_ARTWORK[0]?.src || '';
});

const heroLinesImageUrl = computed(() => {
  const saved = content.value?.hero_lines_image_url
    ? String(content.value.hero_lines_image_url).trim()
    : '';
  return saved || PLACEHOLDER_ARTWORK[1]?.src || PLACEHOLDER_ARTWORK[0]?.src || '';
});

const aboutMeImages = computed(() => {
  const left = content.value?.about_me_left_image_url
    ? String(content.value.about_me_left_image_url).trim()
    : '';
  const right = content.value?.about_me_right_image_url
    ? String(content.value.about_me_right_image_url).trim()
    : '';
  const fallback = PLACEHOLDER_ARTWORK.map((item) => item.src);
  return {
    left: left || fallback[0],
    right: right || fallback[1] || fallback[0]
  };
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
