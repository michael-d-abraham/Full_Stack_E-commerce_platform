<template>
  <div v-if="hasMeta" class="product-detail-meta">
    <p v-if="product.year_created != null" class="product-detail-meta__line">
      Year: {{ product.year_created }}
    </p>
    <p v-if="productFormat(product)" class="product-detail-meta__line">
      Format: {{ productFormat(product) }}
    </p>
    <p v-if="product.size_label" class="product-detail-meta__line">
      Size: {{ product.size_label }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { productFormat } from '../../utils/storefrontProduct.js';

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
});

const hasMeta = computed(() => (
  props.product.year_created != null
  || Boolean(productFormat(props.product))
  || Boolean(props.product.size_label)
));
</script>

<style scoped>
.product-detail-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
}

.product-detail-meta__line {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 300;
  line-height: 1.45;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  text-align: inherit;
}
</style>
