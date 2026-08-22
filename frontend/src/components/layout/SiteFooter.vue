<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <section
        v-if="showFooterActions"
        id="say-hi"
        class="site-footer__actions"
        :class="{ 'site-footer__actions--split': showFooterContact && showFooterBook }"
        aria-label="say hi"
      >
        <div v-if="showFooterContact" id="contact" class="site-footer__action">
          <header class="site-footer__section-head">
            <h2 id="footer-contact-heading" class="site-footer__section-title">
              {{ page.page_title }}
            </h2>
            <div class="site-footer__section-divider" aria-hidden="true" />
          </header>
          <ContactForm compact field-id-prefix="footer-contact" />
        </div>
        <div
          v-if="showFooterContact && showFooterBook"
          class="site-footer__actions-divider"
          aria-hidden="true"
        />
        <div v-if="showFooterBook" id="book" class="site-footer__action site-footer__action--book">
          <header class="site-footer__section-head">
            <h2 class="site-footer__section-title">{{ bookPage.page_title }}</h2>
            <div class="site-footer__section-divider" aria-hidden="true" />
          </header>
          <BookCta :show-title="false" footer />
        </div>
      </section>

      <div class="site-footer__utility">
        <div class="site-footer__signature">
          <router-link to="/" class="site-footer__mark" aria-label="madd.lines home">
            madd.lines
          </router-link>
          <p class="site-footer__legal">©{{ copyrightYear }} madd.lines</p>
        </div>

        <nav v-if="links.length" class="site-footer__nav" aria-label="social media">
          <ul class="site-footer__links">
            <li v-for="link in links" :key="link.platform">
              <a
                :href="link.url"
                class="site-footer__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ socialLabel(link) }}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getPublicSocialLinks } from '../../services/api.js';
import { PLATFORM_LABELS } from '@shared/socialLinksDefaults.js';
import { useContactPage } from '../../composables/useContactPage.js';
import { useBookPage } from '../../composables/useBookPage.js';
import ContactForm from '../contact/ContactForm.vue';
import BookCta from '../book/BookCta.vue';

const route = useRoute();
const { page, ensureContactPage } = useContactPage();
const { page: bookPage, ensureBookPage } = useBookPage();
const copyrightYear = new Date().getFullYear();
const labels = PLATFORM_LABELS;
const links = ref([]);

const showFooterContact = computed(() => route.name !== 'contact');
const showFooterBook = computed(() => route.name !== 'book-appointment');
const showFooterActions = computed(() => showFooterContact.value || showFooterBook.value);

function socialLabel(link) {
  const raw = link.label || labels[link.platform] || link.platform;
  return String(raw).trim().toLowerCase();
}

onMounted(async () => {
  ensureContactPage();
  ensureBookPage();
  try {
    const data = await getPublicSocialLinks();
    links.value = Array.isArray(data.links) ? data.links : [];
  } catch {
    links.value = [];
  }
});
</script>
