<template>
  <div v-if="text" class="product-description">
    <p class="product-description__text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.product-description {
  margin: 0;
  padding: 0;
}

.product-description__text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 0.875rem;
  font-weight: 300;
  letter-spacing: 0.02em;
  color: var(--color-text-muted);
}
</style>
