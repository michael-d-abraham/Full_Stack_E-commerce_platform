<template>
  <article class="product-card" :class="{ 'product-card--linkable': !showAddToCart }">
    <component
      :is="galleryLinkTag"
      v-if="!showAddToCart"
      v-bind="galleryLinkBindings"
      class="product-card-link gallery-art-presentation"
      :aria-label="`${productTitle(product)} — view product`"
      @click="onGalleryLinkClick"
    >
      <GalleryArtFrame
        :src="primaryProductImageUrl(product)"
        :alt="thumbAlt(product)"
      />
      <div v-if="showTitle" class="product-info gallery-product-meta gallery-plaque gallery-plaque-typography">
        <h3 class="product-title gallery-product-title">{{ productTitle(product) }}</h3>
      </div>
    </component>

    <template v-else>
      <router-link
        :to="detailRoute"
        class="product-image-link"
        :aria-label="`${productTitle(product)} — view product`"
      >
        <div class="product-image-frame">
          <img
            v-if="primaryProductImageUrl(product)"
            class="product-image"
            :src="primaryProductImageUrl(product)"
            :alt="thumbAlt(product)"
            loading="lazy"
          />
          <span v-else class="product-image product-image--placeholder">No image</span>
        </div>
      </router-link>

      <div class="product-info">
        <router-link
          :to="detailRoute"
          class="product-title-link"
        >
          <h3 class="product-title">{{ productTitle(product) }}</h3>
        </router-link>
        <p class="product-price">{{ formatMoneyFromCents(product.price_cents, product.currency || 'usd') }}</p>
      </div>

      <button
        type="button"
        class="add-to-cart-button"
        :disabled="previewOnly || !canAddToCart(product) || showAdded"
        :aria-label="`Add ${displayProductName(product)} to cart`"
        @click="onAddToCart"
      >
        {{
          showAdded
            ? 'Added'
            : canAddToCart(product)
              ? 'Add to Cart'
              : 'Out of stock'
        }}
      </button>
    </template>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import GalleryArtFrame from './GalleryArtFrame.vue';
import { addToCart } from '../../utils/cart.js';
import { formatMoneyFromCents } from '../../utils/money.js';
import {
  displayProductName,
  primaryProductImageUrl,
  productTitle
} from '../../utils/storefrontProduct.js';

const props = defineProps({
  product: { type: Object, required: true },
  showAdded: { type: Boolean, default: false },
  previewOnly: { type: Boolean, default: false },
  showAddToCart: { type: Boolean, default: true },
  navigationMode: {
    type: String,
    default: 'route',
    validator: (value) => value === 'route' || value === 'emit'
  }
});

const emit = defineEmits(['added', 'open']);

const showTitle = computed(() => {
  const label = String(props.product?.label || props.product?.title || '').trim();
  return Boolean(label);
});

const detailRoute = computed(() => ({
  name: 'gallery',
  query: { product: props.product.slug }
}));

const galleryLinkTag = computed(() => (props.navigationMode === 'emit' ? 'button' : 'router-link'));

const galleryLinkBindings = computed(() => {
  if (props.navigationMode === 'emit') {
    return { type: 'button' };
  }
  return { to: detailRoute.value };
});

function onGalleryLinkClick(event) {
  if (props.navigationMode !== 'emit') {
    return;
  }
  event.preventDefault();
  emit('open', props.product.slug);
}

function thumbAlt(p) {
  const primary = p.product_images?.find((i) => i?.is_primary) || p.product_images?.[0];
  if (primary && primary.alt_text) {
    return primary.alt_text;
  }
  return productTitle(p);
}

function canAddToCart(p) {
  const q = p?.quantity_available;
  if (q == null || typeof q !== 'number') {
    return true;
  }
  return q > 0;
}

function onAddToCart() {
  if (props.previewOnly) return;
  const result = addToCart(props.product);
  if (result.ok) {
    emit('added', props.product);
  }
}
</script>
