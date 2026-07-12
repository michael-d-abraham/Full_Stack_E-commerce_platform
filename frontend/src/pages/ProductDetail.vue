<template>
  <div
    class="product-page product-page--overlay"
    @click="onDesktopBackdropClick"
  >
    <!-- Mobile overlay: one scroll surface; close stays fixed outside the sheet -->
    <div
      v-if="isMobile"
      class="product-page__content product-page__content--mobile product-page__content--overlay"
    >
      <Teleport :to="overlayControlsEl" :disabled="!useOverlayCloseTeleport">
        <ProductCloseButton
          v-if="useOverlayCloseTeleport"
          placement="overlay"
          flush
          as-button
          @close="emit('close')"
        />
      </Teleport>

      <div class="product-page__media-shell">
        <ProductImageGallery
          v-if="imageList.length"
          ref="galleryRef"
          priority
          :images="imageList"
          :image-alt="product ? productTitle(product) : 'Product image'"
          @lightbox-change="imageLightboxOpen = $event"
        />
        <div v-else class="product-skeleton product-skeleton--image" aria-hidden="true" />
      </div>

      <div class="product-page__details product-page__details--stacked">
        <header v-if="product" class="product-page__intro gallery-plaque-typography">
          <ProductInfo
            :title="productTitle(product)"
            :show-price="false"
          />
          <p v-if="formattedPrice != null" class="product-page__price gallery-product-price">
            {{ formattedPrice }}
          </p>
        </header>
        <div v-else class="product-skeleton-group product-page__intro" aria-hidden="true">
          <div class="product-skeleton product-skeleton--title" />
          <div class="product-skeleton product-skeleton--price" />
        </div>

        <ProductDescription
          v-if="showMobileDetails"
          :text="product?.description || ''"
          :meta-lines="mobileDetailLines"
          collapsible
          :collapsed-lines="0"
        />
        <div
          v-else-if="!product"
          class="product-skeleton-group product-skeleton-group--description"
          aria-hidden="true"
        >
          <div class="product-skeleton product-skeleton--line" />
          <div class="product-skeleton product-skeleton--line product-skeleton--line-short" />
        </div>

        <div class="product-page__purchase">
          <AddToCartButton
            v-if="product"
            :label="addButtonLabel"
            :disabled="!canBuy || added"
            :aria-label="`Add ${productTitle(product)} to cart`"
            @click="onAddToCart"
          />
          <div
            v-else
            class="product-skeleton product-skeleton--cart"
            aria-hidden="true"
          />
        </div>
      </div>

      <p v-if="error" class="error product-page__inline-error">{{ error }}</p>
    </div>

    <!-- Desktop overlay layout -->
    <article v-else class="detail detail--desktop">
      <div ref="detailCardRef" class="detail__card" @click="onDesktopCardBackdropClick">
        <ProductCloseButton
          class="detail__close"
          flush
          back-to="/gallery"
          :label="imageLightboxOpen ? 'Close enlarged image' : 'Close and return to gallery'"
          as-button
          @close="onDesktopClose"
        />

        <div
          v-if="product"
          ref="detailGridRef"
          class="detail__grid"
          :class="{
            'detail__grid--lightbox-open': imageLightboxOpen
          }"
        >
          <div class="detail__media">
            <ProductImageGallery
              v-if="imageList.length"
              ref="galleryRef"
              class="detail__gallery"
              priority
              :images="imageList"
              :image-alt="productTitle(product)"
              contained-lightbox
              :lightbox-target="detailGridRef"
              @lightbox-change="imageLightboxOpen = $event"
            />
          </div>

          <div class="detail__info gallery-plaque-typography gallery-plaque-typography--start">
            <h1 class="page-title gallery-product-title">{{ productTitle(product) }}</h1>

            <p v-if="product.price_cents != null" class="price gallery-product-price">
              {{ formatMoneyFromCents(product.price_cents, product.currency || 'usd') }}
            </p>

            <ProductDescription
              :text="product.description || ''"
              :meta-lines="productMetaLines(product)"
              collapsible
            />

            <div class="detail__purchase">
              <p v-if="showStock" class="meta stock">Available: {{ product.quantity_available }}</p>
              <AddToCartButton
                :label="addButtonLabel"
                :disabled="!canBuy || added"
                :aria-label="`Add ${productTitle(product)} to cart`"
                @click="onAddToCart"
              />
            </div>
          </div>
        </div>

        <div v-else class="detail__grid detail__grid--loading" aria-hidden="true">
          <div class="detail__media">
            <div class="product-skeleton product-skeleton--image product-skeleton--desktop-image" />
          </div>
          <div class="detail__info">
            <div class="product-skeleton product-skeleton--title product-skeleton--desktop-title" />
            <div class="product-skeleton product-skeleton--price product-skeleton--desktop-price" />
            <div class="product-skeleton product-skeleton--cart product-skeleton--desktop-cart" />
            <div class="product-skeleton-group product-skeleton-group--description">
              <div class="product-skeleton product-skeleton--line" />
              <div class="product-skeleton product-skeleton--line product-skeleton--line-short" />
            </div>
          </div>
        </div>

        <p v-if="error" class="error product-page__inline-error product-page__inline-error--desktop">{{ error }}</p>
      </div>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject } from 'vue';
import {
  getCachedProduct,
  setCachedProduct,
  fetchProduct,
  refreshProductInBackground,
  isProductDetailComplete
} from '../composables/useProductCache.js';
import { addToCart } from '../utils/cart.js';
import { useCart } from '../composables/useCart.js';
import { useMediaQuery } from '../composables/useMediaQuery.js';
import { formatMoneyFromCents } from '../utils/money.js';
import {
  productTitle,
  productMetaLines,
  hasProductMeta
} from '../utils/storefrontProduct.js';
import ProductCloseButton from '../components/product/ProductCloseButton.vue';
import ProductImageGallery from '../components/product/ProductImageGallery.vue';
import ProductInfo from '../components/product/ProductInfo.vue';
import AddToCartButton from '../components/product/AddToCartButton.vue';
import ProductDescription from '../components/product/ProductDescription.vue';

const props = defineProps({
  slug: {
    type: String,
    required: true
  },
  /** @deprecated Always rendered inside ProductDetailOverlay; kept for call-site compat */
  overlay: {
    type: Boolean,
    default: true
  },
  initialProduct: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'lightbox-change']);

const isMobile = useMediaQuery('(max-width: 640px)');
const overlayControlsTarget = inject('productOverlayControlsTarget', ref(null));
const overlayControlsEl = computed(() => overlayControlsTarget?.value ?? null);
const useOverlayCloseTeleport = computed(
  () => isMobile.value && Boolean(overlayControlsEl.value)
);
const { openDrawer } = useCart();

function resolveCachedProduct(slug) {
  const cached = getCachedProduct(slug);
  if (cached) {
    return cached;
  }
  if (props.initialProduct?.slug === slug) {
    return props.initialProduct;
  }
  return null;
}

const cachedProduct = resolveCachedProduct(props.slug);
const product = ref(cachedProduct);
if (cachedProduct?.slug) {
  setCachedProduct(cachedProduct.slug, cachedProduct, {
    complete: isProductDetailComplete(cachedProduct.slug)
  });
}
const loading = ref(!cachedProduct);
const error = ref('');
const added = ref(false);
const detailGridRef = ref(null);
const detailCardRef = ref(null);
const galleryRef = ref(null);
const imageLightboxOpen = ref(false);

const imageList = computed(() => {
  const imgs = product.value?.product_images;
  if (!Array.isArray(imgs) || !imgs.length) {
    return [];
  }
  return imgs
    .filter((i) => i && i.image_url)
    .sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary));
});

const formattedPrice = computed(() => {
  if (product.value?.price_cents == null) return null;
  return formatMoneyFromCents(
    product.value.price_cents,
    product.value.currency || 'usd'
  );
});

const showStock = computed(() => {
  const q = product.value?.quantity_available;
  return q != null && typeof q === 'number';
});

const canBuy = computed(() => {
  const q = product.value?.quantity_available;
  if (q == null || typeof q !== 'number') {
    return true;
  }
  return q > 0;
});

const addButtonLabel = computed(() => {
  if (added.value) return 'Added';
  if (!canBuy.value) return 'Out of stock';
  return 'Add to Cart';
});

const productMeta = computed(() => (product.value ? productMetaLines(product.value) : []));

const mobileDetailLines = computed(() => {
  const lines = [...productMeta.value];
  if (showStock.value && product.value) {
    lines.push(`Available: ${product.value.quantity_available}`);
  }
  return lines;
});

const showProductDescription = computed(() => {
  if (!product.value) {
    return false;
  }
  return Boolean(String(product.value.description || '').trim()) || hasProductMeta(product.value);
});

const showMobileDetails = computed(() => {
  if (!product.value) {
    return false;
  }
  return showProductDescription.value || showStock.value;
});

function onDesktopClose() {
  if (imageLightboxOpen.value) {
    galleryRef.value?.closeLightbox();
    return;
  }
  emit('close');
}

function onDesktopCardBackdropClick(event) {
  if (isMobile.value || !imageLightboxOpen.value) {
    return;
  }
  const grid = detailGridRef.value;
  if (!grid || grid.contains(event.target)) {
    return;
  }
  if (event.target.closest('.product-close-button')) {
    return;
  }
  closeImageLightbox();
}

function onDesktopBackdropClick(event) {
  if (isMobile.value || !product.value) {
    return;
  }
  const card = event.currentTarget.querySelector('.detail__card');
  if (!card || card.contains(event.target)) {
    return;
  }
  onDesktopClose();
}

function closeImageLightbox() {
  galleryRef.value?.closeLightbox();
}

defineExpose({ closeImageLightbox });

function onAddToCart() {
  if (!product.value || !canBuy.value) return;
  const result = addToCart(product.value);
  if (!result.ok) return;
  openDrawer();
  added.value = true;
  window.setTimeout(() => {
    added.value = false;
  }, 1500);
}

let loadRequestId = 0;

function applyProduct(productData) {
  if (!productData) {
    return;
  }

  setCachedProduct(productData.slug, productData, {
    complete: isProductDetailComplete(productData.slug)
  });
  product.value = productData;
}

async function load() {
  const slug = props.slug;
  const cached = resolveCachedProduct(slug);
  const requestId = ++loadRequestId;

  error.value = '';
  added.value = false;

  if (product.value?.slug !== slug) {
    imageLightboxOpen.value = false;
  }

  if (cached) {
    loading.value = false;
    applyProduct(cached);
    if (requestId !== loadRequestId || props.slug !== slug) {
      return;
    }
    // List/gallery cache is primary-image-only — await full detail so swipe
    // gets every image instead of staying stuck on a single frame.
    if (!isProductDetailComplete(slug)) {
      try {
        const fresh = await fetchProduct(slug);
        if (requestId !== loadRequestId || props.slug !== slug) {
          return;
        }
        applyProduct(fresh);
      } catch (e) {
        if (requestId !== loadRequestId || props.slug !== slug) {
          return;
        }
        if (!product.value) {
          error.value = e.status === 404 ? 'Product not found.' : e.message || 'Failed to load product';
        }
      }
      return;
    }
    refreshProductInBackground(slug, (fresh) => {
      if (requestId === loadRequestId && props.slug === slug) {
        product.value = fresh;
      }
    });
    return;
  }

  if (product.value) {
    loading.value = false;
  } else {
    loading.value = true;
  }

  try {
    const fresh = await fetchProduct(slug);
    if (requestId !== loadRequestId || props.slug !== slug) {
      return;
    }
    applyProduct(fresh);
    refreshProductInBackground(slug, (freshProduct) => {
      if (requestId === loadRequestId && props.slug === slug) {
        product.value = freshProduct;
      }
    });
  } catch (e) {
    if (requestId !== loadRequestId || props.slug !== slug) {
      return;
    }
    error.value = e.status === 404 ? 'Product not found.' : e.message || 'Failed to load product';
  } finally {
    if (requestId === loadRequestId && props.slug === slug) {
      loading.value = false;
    }
  }
}

onMounted(load);
watch(() => props.slug, load);
watch(
  () => props.initialProduct,
  (initialProduct) => {
    if (initialProduct?.slug) {
      // Gallery list rows are primary-image-only — never mark them complete.
      setCachedProduct(initialProduct.slug, initialProduct, {
        complete: isProductDetailComplete(initialProduct.slug)
      });
    }
  },
  { immediate: true }
);

watch(imageLightboxOpen, (open) => {
  emit('lightbox-change', open);
});
</script>

<style scoped>
.product-page {
  width: 100%;
}

.product-page--overlay {
  min-height: 100%;
}

.product-page__content--mobile {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px 20px 48px;
  overflow-x: hidden;
}

.product-page__details--stacked {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.25rem;
}

.product-page__intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.product-page__intro :deep(.product-info) {
  margin-bottom: 0;
}

.detail__info .gallery-product-price {
  margin: 0 0 0.25rem;
}

.product-page__price {
  margin: 0 0 0.125rem;
}

.product-page__purchase {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0;
}

.product-page__availability {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  text-align: center;
}

.product-page__purchase :deep(.add-to-cart-button) {
  height: 46px;
  font-size: 0.9375rem;
  font-weight: 700;
  margin-top: 0.125rem;
}

.product-page__content--mobile :deep(.product-close-button) {
  margin-bottom: 0.25rem;
}

.product-page__content--mobile :deep(.product-image-gallery) {
  margin-bottom: 0.75rem;
}

.product-page__details--stacked :deep(.product-description) {
  margin-top: 0.25rem;
  padding-top: 1.25rem;
}

.product-page__status {
  padding: 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.detail--desktop {
  box-sizing: border-box;
  width: 100%;
}

.detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 2.5rem;
  align-items: start;
}

.detail__media {
  min-width: 0;
}

.detail__info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.detail--desktop .page-title {
  margin: 0;
  padding-right: 2rem;
  text-align: left;
}

.detail__info :deep(.product-detail-meta) {
  margin-top: -0.25rem;
}

.meta {
  color: var(--color-text-muted);
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 300;
  text-align: left;
  letter-spacing: 0.06em;
}

.detail__purchase {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.125rem;
  padding-top: 0;
  border-top: none;
}

.detail__purchase :deep(.add-to-cart-button) {
  width: 100%;
  min-width: 0;
  height: 46px;
  font-size: 1rem;
  font-weight: 700;
}

.detail__info :deep(.product-description) {
  margin-top: 0.5rem;
  padding-top: 1.5rem;
}

.price {
  margin: 0;
  text-align: left;
}

.stock {
  font-size: 0.8125rem;
  text-align: left;
}

@media (min-width: 641px) {
  .product-page:has(.detail--desktop) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
    padding: 48px;
  }

  .product-page:has(.detail--desktop):not(.product-page--overlay) {
    min-height: calc(100dvh - 7rem);
  }

  .product-page--overlay:has(.detail--desktop) {
    min-height: 100%;
    padding: 0;
  }

  .detail--desktop {
    width: min(1180px, calc(100vw - 96px));
    height: min(760px, calc(100vh - 96px));
    max-width: none;
    margin: 0;
  }

  .product-page:not(.product-page--overlay):has(.detail--desktop) .detail--desktop {
    height: min(760px, calc(100dvh - 10rem));
  }

  .product-page:not(.product-page--overlay):has(.detail--desktop) {
    padding: 24px 48px;
  }

  .detail__card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: #fff;
    border: 1px solid var(--color-border);
    overflow: hidden;
    box-sizing: border-box;
  }

  .product-page--overlay .detail__card {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    border-radius: 14px;
  }

  .detail__close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 21;
    margin: 0;
  }

  .detail__grid--lightbox-open .detail__info {
    visibility: hidden;
  }

  .detail__grid {
    flex: 1;
    min-height: 0;
    height: 100%;
    position: relative;
    grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.85fr);
    gap: 40px;
    align-items: stretch;
    padding: 40px 56px 40px 40px;
    box-sizing: border-box;
  }

  .detail__media {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }

  .detail__media :deep(.product-image-gallery) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    margin-bottom: 0;
  }

  .detail__media :deep(.product-image-gallery__stage) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .detail__media :deep(.product-image-gallery__viewport) {
    height: 100%;
    min-height: 0;
  }

  .detail__media :deep(.product-image-gallery__dots) {
    margin-top: 12px;
    flex-shrink: 0;
  }

  .detail__info {
    justify-content: flex-start;
    gap: 1.25rem;
    padding-top: 0.5rem;
    padding-right: 4px;
    overflow-y: auto;
  }

  .detail--desktop .page-title {
    padding-right: 2rem;
  }

  .detail__info :deep(.product-detail-meta__line) {
    font-size: 0.875rem;
    letter-spacing: 0.05em;
    color: var(--color-text);
    opacity: 0.72;
  }

  .detail__purchase {
    gap: 1.125rem;
    margin-top: 0.25rem;
  }

  .detail__purchase :deep(.add-to-cart-button) {
    height: 48px;
    font-size: 1rem;
  }

  .detail__info :deep(.product-description) {
    margin-top: 0.75rem;
    padding-top: 1.75rem;
  }

  .detail__info :deep(.product-description__text) {
    font-size: 0.9375rem;
    line-height: 1.7;
  }

  .price {
    text-align: left;
  }

  .stock {
    font-size: 0.875rem;
    opacity: 0.72;
  }
}

@media (max-width: 640px) {
  .product-page--overlay {
    min-height: 0;
    height: auto;
    width: 100%;
  }

  /* Single scrollport: image + details move together like a native sheet */
  .product-page--overlay .product-page__content--overlay {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    padding: 0 0 calc(env(safe-area-inset-bottom, 0px) + 16px);
  }

  .product-page--overlay .product-page__media-shell {
    position: relative;
    flex-shrink: 0;
    padding-top: 12px;
    overflow: visible;
  }

  /* Stay inside the card — negative bleed was clipping stage controls */
  .product-page--overlay .product-page__content--overlay :deep(.product-image-gallery) {
    --gallery-mobile-viewport-height: min(58svh, 440px);
    width: 100%;
    max-width: none;
    margin: 0 0 0.5rem;
    padding-top: 0;
    overflow: visible;
  }

  .product-page--overlay .product-page__content--overlay :deep(.product-image-gallery__stage) {
    overflow: visible;
  }

  .product-page--overlay .product-page__content--overlay :deep(.product-image-gallery__viewport) {
    overflow: hidden;
  }

  .product-page--overlay .product-skeleton--image {
    width: 100%;
    max-width: none;
    margin: 0 0 0.5rem;
    height: min(58svh, 440px);
    min-height: min(58svh, 440px);
    max-height: min(58svh, 440px);
  }

  .product-page--overlay .product-page__details--stacked {
    gap: 1rem;
    margin-top: 0;
    padding: 0 16px;
    flex: 0 0 auto;
    min-height: 0;
    overflow: visible;
  }

  .product-page--overlay .product-page__purchase {
    gap: 0.875rem;
    margin-top: 0.125rem;
  }

  .product-page--overlay .product-page__details--stacked :deep(.product-description) {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  .product-page--overlay .product-page__purchase :deep(.add-to-cart-button) {
    margin-top: 0;
  }
}

.product-page__inline-error {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  text-align: center;
}

.product-page__inline-error--desktop {
  position: absolute;
  left: 40px;
  right: 56px;
  bottom: 24px;
  margin: 0;
  text-align: left;
}

.product-skeleton--desktop-image {
  width: 100%;
  height: 100%;
  min-height: 280px;
  border-radius: 0;
}

.product-skeleton--desktop-title {
  height: 1.375rem;
  width: 68%;
  margin-bottom: 0.75rem;
}

.product-skeleton--desktop-price {
  height: 1.125rem;
  width: 32%;
  margin-bottom: 1.25rem;
}

.product-skeleton--desktop-cart {
  height: 46px;
  width: 100%;
  border-radius: 0;
}

.product-skeleton {
  background: linear-gradient(90deg, #f2f2f2 0%, #e8e8e8 50%, #f2f2f2 100%);
  background-size: 200% 100%;
  animation: product-skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 4px;
}

.product-skeleton--image {
  background-color: var(--color-product-image-bg, #f8f8f8);
  animation: none;
}

.product-skeleton--title {
  height: 1.125rem;
  width: 72%;
  margin-bottom: 0.375rem;
}

.product-skeleton--price {
  height: 0.9375rem;
  width: 28%;
}

.product-skeleton--availability {
  height: 0.8125rem;
  width: 40%;
}

.product-skeleton--size {
  height: 2.25rem;
  width: 100%;
  border-radius: 0;
}

.product-skeleton--cart {
  height: 44px;
  width: 100%;
  border-radius: 0;
}

.product-skeleton-group--description {
  margin-top: 0.25rem;
  padding-top: 1.25rem;
}

.product-skeleton--line {
  height: 0.875rem;
  width: 100%;
  margin-bottom: 0.5rem;
}

.product-skeleton--line-short {
  width: 65%;
  margin-bottom: 0;
}

.product-skeleton-group {
  display: flex;
  flex-direction: column;
}

@keyframes product-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-skeleton {
    animation: none;
    background: #ececec;
  }
}

@media (max-width: 390px) {
  .product-page__content--mobile,
  .product-page__status {
    padding-left: 16px;
    padding-right: 16px;
  }

  .product-page--overlay .product-page__content--overlay {
    padding-left: 0;
    padding-right: 0;
  }

  .product-page--overlay .product-page__details--stacked {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>
