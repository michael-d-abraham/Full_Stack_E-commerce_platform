<template>
  <component :is="tag" v-bind="linkProps" :class="rootClasses">
    <SmartImage
      v-if="usesImageBrand"
      class="site-brand-mark__logo"
      :src="siteNameLogoUrl"
      :alt="siteName"
      priority
      :fade-in="false"
      :width="320"
      :widths="[160, 240, 320]"
      sizes="(max-width: 640px) 40vw, 12rem"
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
    validator: (value) => ['header', 'footer', 'footer-anchor', 'admin'].includes(value)
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
  text-transform: lowercase;
}

.site-brand-mark__logo {
  display: block;
  width: auto;
  height: 2rem;
  max-width: min(12rem, 52vw);
}

.site-brand-mark--header .site-brand-mark__text {
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
}

.site-brand-mark--footer .site-brand-mark__text {
  font-size: 1rem;
}

.site-brand-mark--footer-anchor {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  justify-content: center;
}

.site-brand-mark--footer-anchor .site-brand-mark__text {
  font-size: clamp(3rem, 14vw, 9rem);
  line-height: 0.95;
  text-align: center;
  white-space: normal;
  word-break: break-word;
}

.site-brand-mark--footer-anchor.site-brand-mark--image {
  min-height: 0;
}

.site-brand-mark--footer-anchor .site-brand-mark__logo {
  height: clamp(3rem, 12vw, 7rem);
  max-width: min(100%, 48rem);
}

.site-brand-mark--admin .site-brand-mark__text {
  font-size: 1rem;
}

.site-brand-mark--header.site-brand-mark--image {
  min-height: 1.5rem;
}

.site-brand-mark--admin.site-brand-mark--image {
  min-height: 2.25rem;
}

.site-brand-mark--header .site-brand-mark__logo {
  height: 1.5rem;
  max-width: min(7.5rem, 36vw);
}

.site-brand-mark--admin .site-brand-mark__logo {
  height: 2.25rem;
}
</style>
