<template>
  <div
    class="product-grid-loading"
    :class="{
      'product-grid-loading--page': variant === 'page',
      'product-grid-loading--section': variant === 'section'
    }"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="product-grid-loading__inner">
      <div class="product-grid-loading__spinner" aria-hidden="true" />
      <p class="product-grid-loading__message">{{ message }}</p>
      <div class="product-grid-loading__skeletons" aria-hidden="true">
        <div
          v-for="n in skeletonCount"
          :key="n"
          class="product-grid-loading__skeleton-card"
        >
          <div class="product-grid-loading__skeleton-frame">
            <div class="product-grid-loading__skeleton-mat" />
          </div>
          <div class="product-grid-loading__skeleton-line product-grid-loading__skeleton-line--title" />
          <div class="product-grid-loading__skeleton-line product-grid-loading__skeleton-line--price" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'page',
    validator: (value) => value === 'page' || value === 'section'
  },
  message: {
    type: String,
    default: 'Preparing gallery…'
  },
  skeletonCount: {
    type: Number,
    default: 3
  }
});
</script>

<style scoped>
.product-grid-loading {
  width: 100%;
  background: var(--gallery-mat-bg, #f7f4ee);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.product-grid-loading--page {
  min-height: 52vh;
  padding: 3rem 32px 4rem;
}

.product-grid-loading--section {
  min-height: 28rem;
  padding: 2.5rem 32px 3rem;
}

.product-grid-loading__inner {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.product-grid-loading__spinner {
  width: 28px;
  height: 28px;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-top-color: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  animation: product-grid-loading-spin 0.85s linear infinite;
}

.product-grid-loading__message {
  margin: 1.25rem 0 0;
  font-size: 0.8125rem;
  font-weight: 300;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a8680;
}

.product-grid-loading__skeletons {
  width: 100%;
  margin-top: 2.75rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2.5rem 4rem;
}

.product-grid-loading__skeleton-card {
  width: min(100%, 220px);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.product-grid-loading__skeleton-frame {
  width: 100%;
  padding: 2.5px;
  background: #1a1a1a;
  box-shadow:
    2px 4px 8px rgba(0, 0, 0, 0.05),
    4px 10px 22px rgba(0, 0, 0, 0.08);
}

.product-grid-loading__skeleton-mat {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(
    110deg,
    rgba(255, 255, 255, 0.35) 8%,
    rgba(255, 255, 255, 0.75) 18%,
    rgba(255, 255, 255, 0.35) 33%
  );
  background-size: 200% 100%;
  animation: product-grid-loading-shimmer 1.4s ease-in-out infinite;
}

.product-grid-loading__skeleton-line {
  height: 10px;
  margin-top: 1rem;
  border-radius: 0;
  background: rgba(0, 0, 0, 0.06);
  animation: product-grid-loading-shimmer 1.4s ease-in-out infinite;
}

.product-grid-loading__skeleton-line--title {
  width: 72%;
}

.product-grid-loading__skeleton-line--price {
  width: 42%;
  margin-top: 0.5rem;
}

@keyframes product-grid-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes product-grid-loading-shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-grid-loading__spinner,
  .product-grid-loading__skeleton-mat,
  .product-grid-loading__skeleton-line {
    animation: none;
  }
}

@media (max-width: 640px) {
  .product-grid-loading--page {
    min-height: 44vh;
    padding: 2rem var(--mobile-safe-inset-x, 20px) 3rem;
  }

  .product-grid-loading--section {
    min-height: 22rem;
    padding: 2rem var(--mobile-safe-inset-x, 20px) 2.5rem;
  }

  .product-grid-loading__skeletons {
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }
}
</style>
