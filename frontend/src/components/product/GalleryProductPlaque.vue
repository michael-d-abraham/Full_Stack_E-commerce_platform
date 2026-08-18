<template>
  <div class="product-info gallery-product-meta gallery-plaque gallery-plaque-typography">
    <h3 class="product-title gallery-product-title">{{ title }}</h3>
    <p class="product-price gallery-product-price">{{ price }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  price: { type: String, required: true }
});
</script>
