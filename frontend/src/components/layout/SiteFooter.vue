<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <section
        v-if="showFooterActions"
        id="say-hi"
        class="site-footer__actions"
        aria-label="say hi"
      >
        <div v-if="showFooterContact" id="contact" class="site-footer__action">
          <h2 id="footer-contact-heading" class="site-footer__action-title">
            {{ page.page_title }}
          </h2>
          <ContactForm compact field-id-prefix="footer-contact" />
        </div>
        <div v-if="showFooterBook" id="book" class="site-footer__action">
          <BookCta />
        </div>
      </section>

      <div class="site-footer__utility">
        <p class="site-footer__tagline">tattoo artist portfolio.</p>

        <div class="site-footer__nav-group">
          <nav class="site-footer__nav" aria-label="site navigation">
            <ul class="site-footer__links">
              <li v-for="item in navItems" :key="item.id">
                <a
                  :href="`/${storefrontHash(item.id)}`"
                  class="site-footer__link"
                  :class="{ 'is-active': activeSectionId === item.id }"
                  @click="goToSection($event, item.id)"
                >
                  {{ item.label }}
                </a>
              </li>
            </ul>
          </nav>

          <nav v-if="links.length" class="site-footer__nav" aria-label="social media">
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
        <router-link to="/" class="site-footer__mark" aria-label="madd lines home">
          madd lines
        </router-link>
        <p class="site-footer__legal">©{{ copyrightYear }} madd lines</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getPublicSocialLinks } from '../../services/api.js';
import { PLATFORM_LABELS } from '@shared/socialLinksDefaults.js';
import { storefrontHash } from '../../constants/storefrontSections.js';
import { useStorefrontSectionNav } from '../../composables/useStorefrontSectionNav.js';
import { useContactPage } from '../../composables/useContactPage.js';
import ContactForm from '../contact/ContactForm.vue';
import BookCta from '../book/BookCta.vue';

const route = useRoute();
const { navItems, activeSectionId, goToSection } = useStorefrontSectionNav();
const { page, ensureContactPage } = useContactPage();
const copyrightYear = new Date().getFullYear();
const labels = PLATFORM_LABELS;
const links = ref([]);

const showFooterContact = computed(() => route.name !== 'contact');
const showFooterBook = computed(() => route.name !== 'book-appointment');
const showFooterActions = computed(() => showFooterContact.value || showFooterBook.value);

onMounted(async () => {
  ensureContactPage();
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

.site-footer__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-2xl);
  align-items: start;
  padding-bottom: var(--space-xl);
  margin-bottom: var(--space-xl);
  border-bottom: 1px solid var(--footer-rule, color-mix(in srgb, var(--color-text) 10%, var(--color-paper)));
}

.site-footer__action-title {
  margin: 0 0 var(--space-lg);
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: 0.08em;
  text-transform: lowercase;
  color: var(--color-text);
}

.site-footer__action :deep(.contact-page__form) {
  max-width: 28rem;
}

.site-footer__action :deep(input),
.site-footer__action :deep(textarea) {
  background: var(--color-paper);
  border-color: color-mix(in srgb, var(--color-text) 14%, var(--color-paper));
}

.site-footer__action :deep(textarea) {
  min-height: 6rem;
}

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
  border-top: 1px solid var(--footer-rule, color-mix(in srgb, var(--color-text) 10%, var(--color-paper)));
  text-align: center;
}

.site-footer__mark {
  display: block;
  margin: 0;
  font-family: var(--font-sans);
  font-size: clamp(1.75rem, 6.5vw, 3.75rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.04em;
  text-transform: lowercase;
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
  .site-footer__actions {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-xl);
    padding-bottom: var(--space-lg);
    margin-bottom: var(--space-lg);
  }

  .site-footer__action :deep(.contact-page__form.form button) {
    width: 100%;
    align-self: stretch;
    min-height: 48px;
  }

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
