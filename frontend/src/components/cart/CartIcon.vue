<template>
  <button
    type="button"
    class="cart-icon-btn"
    :aria-label="ariaLabel"
    :aria-expanded="drawerOpen"
    @click="toggleDrawer"
  >
    <BagIcon :size="iconSize" />
    <span
      v-if="itemCount > 0"
      class="cart-icon-btn__badge"
      aria-hidden="true"
    >
      {{ displayCount }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import BagIcon from './BagIcon.vue';
import { useCart } from '../../composables/useCart.js';
import { useMediaQuery } from '../../composables/useMediaQuery.js';

const { itemCount, drawerOpen, toggleDrawer } = useCart();
const isMobile = useMediaQuery('(max-width: 640px)');
const iconSize = computed(() => (isMobile.value ? 26 : 40));

const displayCount = computed(() => {
  if (itemCount.value > 99) return '99+';
  return String(itemCount.value);
});

const ariaLabel = computed(() => {
  const n = itemCount.value;
  if (n <= 0) return 'Open cart';
  if (n === 1) return 'Open cart, 1 item';
  return `Open cart, ${n} items`;
});
</script>

<style scoped>
.cart-icon-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text);
  cursor: pointer;
}

.cart-icon-btn:hover {
  color: var(--color-text-muted);
  background: rgba(0, 0, 0, 0.04);
}

.cart-icon-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
  border-radius: var(--radius-sm);
}

.cart-icon-btn__badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.28rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-text, #111);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  pointer-events: none;
  transform: translate(20%, -15%);
}

@media (max-width: 640px) {
  .cart-icon-btn {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    margin: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  .cart-icon-btn:hover {
    background: transparent;
    color: var(--color-text);
  }

  .cart-icon-btn__badge {
    top: 4px;
    right: 2px;
    min-width: 1rem;
    height: 1rem;
    font-size: 0.5625rem;
    transform: none;
  }
}
</style>
