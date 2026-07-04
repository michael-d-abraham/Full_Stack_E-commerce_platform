<template>
  <router-link
    :to="to"
    class="site-brand-mark"
    :class="`site-brand-mark--${variant}`"
    :aria-label="ariaLabel"
  >
    <img
      v-if="showBrandLogo"
      class="site-brand-mark__logo"
      :src="siteLogoUrl"
      :alt="siteName"
      decoding="async"
    />
    <span v-else class="site-brand-mark__text">{{ siteName }}</span>
  </router-link>
</template>

<script setup>
import { useSiteBrand } from '../../composables/useSiteBrand.js';

defineProps({
  to: { type: String, default: '/' },
  variant: {
    type: String,
    default: 'header',
    validator: (value) => ['header', 'footer', 'admin'].includes(value)
  },
  ariaLabel: { type: String, required: true }
});

const { siteName, siteLogoUrl, showBrandLogo } = useSiteBrand();
</script>

<style scoped>
.site-brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: inherit;
  line-height: 1;
  flex-shrink: 0;
  min-width: 0;
  max-width: 100%;
}

.site-brand-mark:hover,
.site-brand-mark:active,
.site-brand-mark:focus-visible {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .site-brand-mark:hover {
    opacity: 0.85;
  }
}

.site-brand-mark__text {
  font-family: var(--font-sans);
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text);
}

.site-brand-mark--header .site-brand-mark__text {
  font-size: 1.875rem;
}

.site-brand-mark--footer .site-brand-mark__text {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.site-brand-mark--admin .site-brand-mark__text {
  font-size: 1.375rem;
  letter-spacing: 0.12em;
  color: #1a1a1a;
}

.site-brand-mark__logo {
  display: block;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
}

.site-brand-mark--header .site-brand-mark__logo {
  max-height: 34px;
  max-width: min(220px, 100%);
}

.site-brand-mark--footer .site-brand-mark__logo {
  max-height: 26px;
  max-width: min(180px, 100%);
}

.site-brand-mark--admin .site-brand-mark__logo {
  max-height: 30px;
  max-width: min(180px, 100%);
}

@media (max-width: 640px) {
  .site-brand-mark--header .site-brand-mark__text {
    font-size: 1.375rem;
    letter-spacing: 0.12em;
  }

  .site-brand-mark--header .site-brand-mark__logo {
    max-height: 30px;
    max-width: min(180px, 100%);
  }
}

@media (max-width: 390px) {
  .site-brand-mark--header .site-brand-mark__text {
    font-size: 1.25rem;
    letter-spacing: 0.1em;
  }
}
</style>
