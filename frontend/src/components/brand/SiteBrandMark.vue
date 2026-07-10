<template>
  <component :is="tag" v-bind="linkProps" :class="rootClasses">
    <SmartImage
      v-if="usesImageBrand"
      class="site-brand-mark__logo"
      :src="siteNameLogoUrl"
      :alt="siteName"
      priority
      :fade-in="false"
      layout="intrinsic"
      :width="640"
      :widths="[240, 320, 480, 640]"
      sizes="(max-width: 640px) 40vw, 14rem"
      object-fit="contain"
    />
    <span v-else class="site-brand-mark__text">{{ siteName }}</span>
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { useSiteBrand } from '../../composables/useSiteBrand.js';
import SmartImage from '../media/SmartImage.vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'header',
    validator: (value) => ['header', 'footer', 'admin'].includes(value)
  },
  to: {
    type: [String, Object],
    default: ''
  },
  ariaLabel: {
    type: String,
    default: ''
  }
});

const { siteName, siteNameLogoUrl, usesImageBrand } = useSiteBrand();

const tag = computed(() => (props.to ? 'router-link' : 'span'));

const rootClasses = computed(() => [
  'site-brand-mark',
  `site-brand-mark--${props.variant}`,
  { 'site-brand-mark--image': usesImageBrand.value }
]);

const linkProps = computed(() => {
  if (!props.to) {
    return {};
  }
  return {
    to: props.to,
    'aria-label': props.ariaLabel || undefined
  };
});
</script>

<style scoped>
.site-brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: 100%;
  min-height: 2rem;
  text-decoration: none;
  color: inherit;
  line-height: 1;
  flex-shrink: 0;
}

.site-brand-mark__text {
  font-family: var(--font-sans);
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.site-brand-mark__logo {
  display: block;
  width: auto;
  height: 2.25rem;
  max-width: min(12rem, 52vw);
  line-height: 0;
}

.site-brand-mark__logo :deep(.smart-image__img) {
  width: auto;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.site-brand-mark--header .site-brand-mark__text {
  font-size: 1.125rem;
}

.site-brand-mark--footer .site-brand-mark__text {
  font-size: 1rem;
}

.site-brand-mark--admin .site-brand-mark__text {
  font-size: 1rem;
}

.site-brand-mark--admin.site-brand-mark--image {
  min-height: 2.25rem;
}

.site-brand-mark--admin .site-brand-mark__logo {
  height: 2.25rem;
}

@media (max-width: 640px) {
  .site-brand-mark--header {
    min-height: 2.65rem;
  }

  .site-brand-mark--header .site-brand-mark__logo {
    height: 2.65rem;
    max-width: min(13.5rem, 58vw);
  }

  .site-brand-mark--header .site-brand-mark__text {
    font-size: 1.2rem;
  }
}

@media (min-width: 641px) {
  .site-brand-mark--header {
    height: calc(var(--header-bar-height, 5.5rem) * 0.72);
    min-height: calc(var(--header-bar-height, 5.5rem) * 0.72);
    max-height: calc(var(--header-bar-height, 5.5rem) * 0.72);
  }

  .site-brand-mark--header .site-brand-mark__text {
    font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  }

  .site-brand-mark--header .site-brand-mark__logo {
    height: 100%;
    max-height: 100%;
    width: auto;
    max-width: min(22rem, 50vw);
  }

  .site-brand-mark--header .site-brand-mark__logo :deep(.smart-image__img) {
    height: 100%;
    width: auto;
    max-height: 100%;
  }
}
</style>
