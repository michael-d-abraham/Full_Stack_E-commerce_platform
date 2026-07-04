<template>
  <component :is="tag" v-bind="linkProps" :class="rootClasses">
    <img
      v-if="usesImageBrand"
      class="site-brand-mark__logo"
      :src="siteNameLogoUrl"
      :alt="siteName"
    />
    <span v-else class="site-brand-mark__text">{{ siteName }}</span>
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { useSiteBrand } from '../../composables/useSiteBrand.js';

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
  height: auto;
  max-width: min(12rem, 52vw);
  object-fit: contain;
  object-position: center;
}

.site-brand-mark--header .site-brand-mark__text {
  font-size: 1.875rem;
}

.site-brand-mark--header .site-brand-mark__logo {
  max-height: 3.25rem;
  max-width: min(18rem, 60vw);
}

.site-brand-mark--footer .site-brand-mark__text {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.site-brand-mark--footer .site-brand-mark__logo {
  max-height: 1.75rem;
  max-width: min(10rem, 70vw);
}

.site-brand-mark--admin .site-brand-mark__text {
  font-size: 1.375rem;
  letter-spacing: 0.12em;
}

.site-brand-mark--admin .site-brand-mark__logo {
  max-height: 2rem;
  max-width: min(11rem, 80%);
}

@media (max-width: 640px) {
  .site-brand-mark--header .site-brand-mark__text {
    font-size: 1.375rem;
    letter-spacing: 0.12em;
  }

  .site-brand-mark--header .site-brand-mark__logo {
    max-height: 2.5rem;
    max-width: min(14rem, 68vw);
  }
}
</style>
