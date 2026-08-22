<template>
  <button
    type="button"
    class="add-to-cart-button"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click="$emit('click')"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Add to Cart'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: 'Add to cart'
  }
});

defineEmits(['click']);
</script>

<style scoped>
.add-to-cart-button {
  width: 100%;
  height: 42px;
  background: var(--color-accent);
  color: var(--color-highlight);
  border: 0;
  border-radius: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  cursor: pointer;
  box-shadow: none;
  transition: background 0.2s ease;
}

.add-to-cart-button:hover:not(:disabled) {
  background: var(--color-accent-hover);
  opacity: 1;
}

.add-to-cart-button:disabled {
  background: var(--color-accent-muted);
  cursor: not-allowed;
}
</style>
