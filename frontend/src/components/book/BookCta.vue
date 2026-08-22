<template>
  <div class="book-cta">
    <h2 v-if="showTitle" class="book-cta__title">{{ page.page_title }}</h2>
    <p class="book-cta__lead">{{ page.body_text }}</p>
    <a
      class="btn-primary book-cta__button"
      :href="page.booking_url"
      target="_blank"
      rel="noopener noreferrer"
      @click="trackBookingClick"
    >
      {{ page.button_label }}
    </a>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useBookPage } from '../../composables/useBookPage.js';

defineProps({
  showTitle: {
    type: Boolean,
    default: true
  }
});

const { page, ensureBookPage } = useBookPage();

function trackBookingClick() {
  if (typeof window.gtag !== 'function') {
    return;
  }
  window.gtag('event', 'book_with_square_click');
}

onMounted(() => {
  ensureBookPage();
});
</script>

<style scoped>
.book-cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-md);
  max-width: 28rem;
}

.book-cta__title {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: 0.08em;
  text-transform: lowercase;
  color: var(--color-text);
}

.book-cta__lead {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 300;
  line-height: 1.55;
  color: var(--color-text-muted);
}

.book-cta__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  text-decoration: none;
}

@media (max-width: 768px) {
  .book-cta {
    max-width: none;
    width: 100%;
  }

  .book-cta__button {
    width: 100%;
    min-height: 48px;
  }
}
</style>
