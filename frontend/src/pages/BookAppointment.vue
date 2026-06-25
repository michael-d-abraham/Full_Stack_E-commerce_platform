<template>
  <div class="book-appointment">
    <h1 class="page-title">{{ pageTitle }}</h1>
    <p class="lead">{{ bodyText }}</p>
    <a
      class="btn-primary book-appointment__cta"
      :href="bookingUrl"
      target="_blank"
      rel="noopener noreferrer"
      @click="trackBookingClick"
    >
      {{ buttonLabel }}
    </a>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPublicBookPage } from '../services/api.js';
import { applyBookPageDefaults, DEFAULT_BOOK_PAGE } from '../constants/bookPageDefaults.js';

const bookingUrl = ref(DEFAULT_BOOK_PAGE.booking_url);
const pageTitle = ref(DEFAULT_BOOK_PAGE.page_title);
const bodyText = ref(DEFAULT_BOOK_PAGE.body_text);
const buttonLabel = ref(DEFAULT_BOOK_PAGE.button_label);

function applySettings(data) {
  const next = applyBookPageDefaults(data);
  bookingUrl.value = next.booking_url || DEFAULT_BOOK_PAGE.booking_url;
  pageTitle.value = next.page_title || DEFAULT_BOOK_PAGE.page_title;
  bodyText.value = next.body_text || DEFAULT_BOOK_PAGE.body_text;
  buttonLabel.value = next.button_label || DEFAULT_BOOK_PAGE.button_label;
}

function trackBookingClick() {
  if (typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', 'book_with_square_click');
}

onMounted(async () => {
  try {
    const data = await getPublicBookPage();
    applySettings(data);
  } catch {
    /* keep defaults */
  }
});
</script>

<style scoped>
.book-appointment {
  max-width: 32rem;
  margin: 0 auto;
  padding: var(--space-2xl) 0 var(--space-3xl);
  text-align: center;
}

.book-appointment .page-title {
  margin-bottom: var(--space-xl);
}

.lead {
  margin: 0 0 var(--space-xl);
  line-height: 1.7;
  font-weight: 300;
  color: var(--color-text-muted);
}

.book-appointment__cta {
  display: inline-block;
  min-width: 14rem;
  margin-bottom: var(--space-lg);
  padding: 0.75rem 2rem;
  text-decoration: none;
  cursor: pointer;
}

@media (max-width: 640px) {
  .book-appointment {
    max-width: 100%;
    padding: var(--space-xl) 0 var(--space-2xl);
  }

  .book-appointment__cta {
    width: 100%;
    min-width: 0;
    min-height: 48px;
  }
}
</style>