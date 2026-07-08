<template>
  <nav
    v-if="total > 1"
    class="product-overlay-gallery-nav"
    :class="{ 'product-overlay-gallery-nav--desktop': desktop }"
    aria-label="Browse gallery artworks"
  >
    <button
      type="button"
      class="product-overlay-gallery-nav__control product-overlay-gallery-nav__control--prev"
      :disabled="!canGoPrev"
      aria-label="Previous artwork"
      @click="$emit('prev')"
    >
      Previous
    </button>
    <span class="product-overlay-gallery-nav__count" aria-live="polite">
      <span class="visually-hidden">Artwork </span>{{ position }} of {{ total }}
    </span>
    <button
      type="button"
      class="product-overlay-gallery-nav__control product-overlay-gallery-nav__control--next"
      :disabled="!canGoNext"
      aria-label="Next artwork"
      @click="$emit('next')"
    >
      Next
    </button>
  </nav>
</template>

<script setup>
defineProps({
  position: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  canGoPrev: {
    type: Boolean,
    default: false
  },
  canGoNext: {
    type: Boolean,
    default: false
  },
  desktop: {
    type: Boolean,
    default: false
  }
});

defineEmits(['prev', 'next']);
</script>

<style scoped>
.product-overlay-gallery-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  margin: 0;
  padding: 0.75rem 0 0;
}

.product-overlay-gallery-nav--desktop {
  padding: 1rem 2.5rem 1.25rem;
  border-top: 1px solid var(--color-border);
  box-sizing: border-box;
}

.product-overlay-gallery-nav__control {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 0.35rem 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-text);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.product-overlay-gallery-nav__control:hover:not(:disabled) {
  opacity: 0.55;
  background: transparent;
}

.product-overlay-gallery-nav__control:disabled {
  opacity: 0.28;
  cursor: not-allowed;
}

.product-overlay-gallery-nav__count {
  flex: 1 1 auto;
  min-width: 0;
  text-align: center;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: 0.625rem;
  font-weight: 300;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a8680;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .product-overlay-gallery-nav {
    padding-top: 0.625rem;
  }

  .product-overlay-gallery-nav__control {
    min-height: 44px;
    font-size: 0.6875rem;
  }
}
</style>
