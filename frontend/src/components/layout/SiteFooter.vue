<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__utility">
        <p class="site-footer__tagline">Tattoo artist portfolio.</p>

        <div class="site-footer__nav-group">
          <nav class="site-footer__nav" aria-label="Site navigation">
            <ul class="site-footer__links">
              <li>
                <router-link to="/" class="site-footer__link" exact-active-class="is-active">Home</router-link>
              </li>
              <li>
                <router-link to="/gallery" class="site-footer__link" active-class="is-active">
                  {{ galleryNavLabel }}
                </router-link>
              </li>
              <li>
                <router-link to="/wanna-dos" class="site-footer__link" active-class="is-active">
                  {{ wannaDosNavLabel }}
                </router-link>
              </li>
              <li v-if="showContactNav">
                <router-link to="/contact" class="site-footer__link" active-class="is-active">Contact</router-link>
              </li>
              <li v-if="showBookNav">
                <router-link to="/book" class="site-footer__link" active-class="is-active">Book</router-link>
              </li>
            </ul>
          </nav>

          <nav v-if="links.length" class="site-footer__nav" aria-label="Social media">
            <ul class="site-footer__links">
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
        </div>
      </div>

      <div class="site-footer__signature">
        <router-link to="/" class="site-footer__mark" aria-label="Madd Lines home">
          Madd Lines
        </router-link>
        <p class="site-footer__legal">©{{ copyrightYear }} Madd Lines</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPublicSocialLinks } from '../../services/api.js';
import { PLATFORM_LABELS } from '@shared/socialLinksDefaults.js';
import { useStorefrontNav } from '../../composables/useStorefrontNav.js';
import { useStorefrontLabels } from '../../composables/useStorefrontLabels.js';

const { showContactNav, showBookNav } = useStorefrontNav();
const { galleryNavLabel, wannaDosNavLabel } = useStorefrontLabels();
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
/* Apple HIG: clarity (one brand moment), deference (quiet utility), consistent rhythm */

.site-footer__utility {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-xl);
  padding-bottom: var(--space-xl);
}

.site-footer__tagline {
  margin: 0;
  max-width: 14rem;
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: var(--color-text-muted);
}

.site-footer__nav-group {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2xl);
}

.site-footer__links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.site-footer__link {
  display: inline-block;
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: -0.01em;
  text-decoration: none;
  color: var(--color-text);
  transition: opacity 0.2s ease;
}

.site-footer__link:hover {
  opacity: 0.55;
}

.site-footer__link.is-active {
  opacity: 0.55;
}

.site-footer__signature {
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-border);
  text-align: center;
}

.site-footer__mark {
  display: block;
  margin: 0;
  font-family: var(--font-sans);
  font-size: clamp(2rem, 7.5vw, 4.75rem);
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-text);
  transition: opacity 0.2s ease;
}

.site-footer__mark:hover {
  opacity: 0.55;
}

.site-footer__legal {
  margin: var(--space-md) 0 0;
  font-size: 0.6875rem;
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .site-footer__utility {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-lg);
    padding-bottom: var(--space-lg);
  }

  .site-footer__tagline {
    max-width: none;
  }

  .site-footer__nav-group {
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
    width: 100%;
  }

  .site-footer__links {
    align-items: center;
    gap: 0.5rem;
  }

  .site-footer__signature {
    padding-top: var(--space-lg);
  }

  .site-footer__mark {
    font-size: clamp(1.75rem, 12vw, 3.25rem);
    letter-spacing: 0.06em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-footer__link,
  .site-footer__mark {
    transition: none;
  }
}
</style>
