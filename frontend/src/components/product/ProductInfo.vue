<template>
  <div class="product-info gallery-plaque-typography">
    <h1 class="product-info__title gallery-product-title">{{ title }}</h1>
    <p v-if="showPrice && price != null" class="product-info__price gallery-product-price">{{ price }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  price: {
    type: String,
    default: null
  },
  showPrice: {
    type: Boolean,
    default: true
  }
});
</script>

<style scoped>
.product-info {
  margin-bottom: 0;
}
</style>
