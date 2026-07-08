<template>
  <Teleport to="body">
    <Transition
      appear
      name="product-overlay"
      :duration="{ enter: overlayTransitionMs, leave: overlayTransitionMs }"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="open"
        ref="panelRef"
        class="product-detail-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Product details"
      >
        <div class="product-detail-overlay__backdrop" aria-hidden="true" @click="onBackdropLayerClick" />
        <div ref="controlsLayerRef" class="product-detail-overlay__controls" />
        <div class="product-detail-overlay__scroll" @click="onBackdropClick">
          <ProductDetail
            ref="productDetailRef"
            :slug="slug"
            :initial-product="initialProduct"
            overlay
            @close="emit('close')"
            @lightbox-change="galleryLightboxOpen = $event"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick, provide } from 'vue';
import ProductDetail from '../../pages/ProductDetail.vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import { lockBodyScroll, unlockBodyScroll, resetBodyScrollLock } from '../../composables/useBodyScrollLock.js';

const isDesktop = useMediaQuery('(min-width: 641px)');
const overlayTransitionMs = computed(() => (isDesktop.value ? 220 : 260));

const props = defineProps({
  slug: {
    type: String,
    required: true
  },
  initialProduct: {
    type: Object,
    default: null
  },
  open: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close', 'after-leave']);

const panelRef = ref(null);
const controlsLayerRef = ref(null);
const productDetailRef = ref(null);
const galleryLightboxOpen = ref(false);
let previousFocus = null;

provide('productOverlayControlsTarget', controlsLayerRef);

function onBackdropClick(event) {
  if (event.target !== event.currentTarget) {
    return;
  }
  onBackdropLayerClick();
}

function onBackdropLayerClick() {
  if (galleryLightboxOpen.value) {
    productDetailRef.value?.closeImageLightbox();
    return;
  }
  emit('close');
}

function onEscape(event) {
  if (event.key !== 'Escape') {
    return;
  }
  if (galleryLightboxOpen.value) {
    productDetailRef.value?.closeImageLightbox();
    return;
  }
  emit('close');
}

function onAfterLeave() {
  emit('after-leave');
}

function setScrollLock(locked) {
  if (locked) {
    lockBodyScroll();
    document.body.classList.add('gallery-product-open');
    return;
  }
  unlockBodyScroll();
  document.body.classList.remove('gallery-product-open');
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previousFocus = document.activeElement;
      setScrollLock(true);
      window.addEventListener('keydown', onEscape);
      await nextTick();
      if (!galleryLightboxOpen.value) {
        const backControl = panelRef.value?.querySelector('.product-close-button');
        backControl?.focus();
      }
    } else {
      galleryLightboxOpen.value = false;
      setScrollLock(false);
      window.removeEventListener('keydown', onEscape);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus({ preventScroll: true });
      }
      previousFocus = null;
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  setScrollLock(false);
  resetBodyScrollLock();
  document.body.classList.remove('gallery-product-open');
  window.removeEventListener('keydown', onEscape);
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus({ preventScroll: true });
  }
});
</script>

<style scoped>
.product-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  background: transparent;
  pointer-events: auto;
}

.product-detail-overlay__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: rgba(255, 255, 255, 0.88);
  cursor: default;
}

.product-detail-overlay__controls {
  position: fixed;
  inset: 0;
  z-index: 1060;
  pointer-events: none;
  overflow: visible;
}

.product-detail-overlay__scroll {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: none;
  cursor: default;
  will-change: opacity, transform;
  pointer-events: none;
}

.product-detail-overlay__scroll > :deep(*) {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .product-detail-overlay {
    padding:
      env(safe-area-inset-top, 0px)
      env(safe-area-inset-right, 0px)
      env(safe-area-inset-bottom, 0px)
      env(safe-area-inset-left, 0px);
    box-sizing: border-box;
  }

  .product-detail-overlay__scroll {
    padding: 16px 28px;
    align-items: center;
  }

  .product-overlay-enter-active .product-detail-overlay__backdrop,
  .product-overlay-leave-active .product-detail-overlay__backdrop {
    transition: opacity 260ms ease;
  }

  .product-overlay-enter-from .product-detail-overlay__backdrop,
  .product-overlay-leave-to .product-detail-overlay__backdrop {
    opacity: 0;
  }

  .product-overlay-enter-active .product-detail-overlay__scroll,
  .product-overlay-leave-active .product-detail-overlay__scroll {
    transition:
      opacity 260ms ease,
      transform 260ms cubic-bezier(0.4, 0, 0.8, 0.6);
  }

  .product-overlay-enter-from .product-detail-overlay__scroll,
  .product-overlay-leave-to .product-detail-overlay__scroll {
    opacity: 0;
    transform: translate3d(0, 52px, 0) scale(0.96);
  }
}

@media (min-width: 641px) {
  .product-detail-overlay__scroll {
    padding: 48px;
  }

  .product-overlay-enter-active .product-detail-overlay__backdrop,
  .product-overlay-leave-active .product-detail-overlay__backdrop {
    transition: opacity 220ms ease;
  }

  .product-overlay-enter-from .product-detail-overlay__backdrop,
  .product-overlay-leave-to .product-detail-overlay__backdrop {
    opacity: 0;
  }

  .product-overlay-enter-active .product-detail-overlay__scroll,
  .product-overlay-leave-active .product-detail-overlay__scroll {
    transition:
      opacity 220ms ease,
      transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .product-overlay-enter-from .product-detail-overlay__scroll,
  .product-overlay-leave-to .product-detail-overlay__scroll {
    opacity: 0;
    transform: scale(0.96) translate3d(0, 14px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-overlay-enter-active,
  .product-overlay-leave-active,
  .product-overlay-enter-active .product-detail-overlay__backdrop,
  .product-overlay-leave-active .product-detail-overlay__backdrop,
  .product-overlay-enter-active .product-detail-overlay__scroll,
  .product-overlay-leave-active .product-detail-overlay__scroll {
    transition: opacity 0.01ms linear;
  }

  .product-overlay-enter-from,
  .product-overlay-leave-to,
  .product-overlay-enter-from .product-detail-overlay__scroll,
  .product-overlay-leave-to .product-detail-overlay__scroll {
    transform: none;
  }
}
</style>
