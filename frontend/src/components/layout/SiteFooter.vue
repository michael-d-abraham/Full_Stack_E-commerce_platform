<template>
  <footer class="site-footer">
    <div
      class="site-footer__main"
      :class="{ 'site-footer__main--two-cols': !links.length }"
    >
      <div class="site-footer__column site-footer__column--brand">
        <SiteBrandMark
          to="/"
          variant="footer"
          class="site-footer__brand"
          :aria-label="brandHomeAriaLabel"
        />
        <p class="site-footer__copyright site-footer__copyright--desktop">©{{ copyrightYear }}&nbsp;{{ siteName }}</p>
      </div>

      <nav class="site-footer__column site-footer__column--navigate" aria-label="Site navigation">
        <h2 class="site-footer__heading">Navigate</h2>
        <ul class="site-footer__list">
          <li>
            <router-link to="/" class="site-footer__link" exact-active-class="site-footer__link--active">
              Home
            </router-link>
          </li>
          <li>
            <router-link to="/gallery" class="site-footer__link" active-class="site-footer__link--active">
              Gallery
            </router-link>
          </li>
          <li v-if="showContactNav">
            <router-link to="/contact" class="site-footer__link" active-class="site-footer__link--active">
              Contact
            </router-link>
          </li>
          <li v-if="showBookNav">
            <router-link to="/book" class="site-footer__link" active-class="site-footer__link--active">
              Book
            </router-link>
          </li>
        </ul>
      </nav>

      <nav v-if="links.length" class="site-footer__column site-footer__column--social" aria-label="Social media">
        <h2 class="site-footer__heading">Social</h2>
        <ul class="site-footer__list">
          <li v-for="link in links" :key="link.platform">
            <a
              :href="link.url"
              class="site-footer__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ link.label || labels[link.platform] || link.platform }}
            </a>
          </li>
        </ul>
      </nav>

      <p class="site-footer__copyright site-footer__copyright--mobile">©{{ copyrightYear }}&nbsp;{{ siteName }}</p>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPublicSocialLinks } from '../../services/api.js';
import { PLATFORM_LABELS } from '@shared/socialLinksDefaults.js';
import { useStorefrontNav } from '../../composables/useStorefrontNav.js';
import { useSiteBrand } from '../../composables/useSiteBrand.js';
import SiteBrandMark from '../brand/SiteBrandMark.vue';

const { showContactNav, showBookNav } = useStorefrontNav();
const { siteName, brandHomeAriaLabel } = useSiteBrand();
const copyrightYear = new Date().getFullYear();
const labels = PLATFORM_LABELS;
const links = ref([]);

onMounted(async () => {
  try {
    const data = await getPublicSocialLinks();
    links.value = Array.isArray(data.links) ? data.links : [];
  } catch {
    links.value = [];
  }
});
</script>

<style scoped>
.site-footer {
  flex-shrink: 0;
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.site-footer__main {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  padding: calc(var(--space-xl) / 2) var(--header-padding-x) var(--space-md);
}

.site-footer__main--two-cols {
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
}

.site-footer__column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 var(--space-2xl);
  border-left: 1px solid var(--color-border);
  min-width: 0;
}

.site-footer__column--brand {
  padding-left: 0;
  border-left: none;
  justify-content: flex-start;
  gap: var(--space-sm);
  min-height: 0;
}

.site-footer__brand {
  text-decoration: none;
  color: var(--color-text);
  line-height: 1.2;
  transition: opacity 0.2s ease;
}

.site-footer__brand:hover {
  opacity: 0.65;
}

.site-footer__heading {
  margin: 0 0 var(--space-md);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1.3;
  color: var(--color-text);
}

.site-footer__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.site-footer__link {
  display: inline-block;
  font-size: 0.9375rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-decoration: none;
  color: var(--color-text);
  transition: opacity 0.2s ease;
}

.site-footer__link:hover {
  opacity: 0.5;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.site-footer__link--active {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.site-footer__copyright {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.site-footer__copyright--mobile {
  display: none;
}

@media (max-width: 900px) {
  .site-footer__main {
    padding: calc(var(--space-lg) / 2) var(--space-2xl) var(--space-sm);
  }
}

@media (max-width: 768px) {
  .site-footer__main,
  .site-footer__main--two-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'navigate social'
      'copyright copyright';
    align-items: start;
    justify-items: center;
    text-align: center;
    gap: var(--space-lg) var(--space-xl);
    padding: var(--space-md) var(--mobile-safe-inset-x)
      calc(var(--space-sm) + env(safe-area-inset-bottom, 0px));
  }

  .site-footer__main--two-cols {
    grid-template-areas:
      'navigate navigate'
      'copyright copyright';
  }

  .site-footer__column--brand {
    display: none;
  }

  .site-footer__column--navigate {
    grid-area: navigate;
  }

  .site-footer__column--social {
    grid-area: social;
  }

  .site-footer__column:not(.site-footer__column--brand) {
    align-items: center;
    width: 100%;
    padding: 0;
    border: none;
  }

  .site-footer__copyright--desktop {
    display: none;
  }

  .site-footer__copyright--mobile {
    display: block;
    grid-area: copyright;
    width: 100%;
    padding-top: var(--space-md);
    border-top: 1px solid var(--color-border);
    font-size: 0.6875rem;
    letter-spacing: 0.12em;
    color: var(--color-text-muted);
  }

  .site-footer__heading {
    margin: 0 0 var(--space-sm);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    color: var(--color-text-muted);
  }

  .site-footer__list {
    align-items: center;
    gap: 0.625rem var(--space-lg);
  }

  .site-footer__main--two-cols .site-footer__list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .site-footer__link {
    font-size: 0.875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}
</style>
