<template>
  <div
    class="mobile-fullscreen-viewer"
    role="dialog"
    aria-modal="true"
    aria-label="Enlarged product image"
    @click="onBackdropClick"
  >
    <ProductCloseButton
      placement="fullscreen"
      label="Close enlarged image"
      as-button
      @close="$emit('close')"
    />

    <ProductGalleryNavButton
      v-if="canSwipe"
      direction="prev"
      context="lightbox"
      :disabled="!canGoPrev || isSliding"
      @click.stop="$emit('prev')"
    />
    <ProductGalleryNavButton
      v-if="canSwipe"
      direction="next"
      context="lightbox"
      :disabled="!canGoNext || isSliding"
      @click.stop="$emit('next')"
    />

    <div
      ref="viewportRef"
      class="mobile-fullscreen-viewer__viewport"
      :class="{ 'mobile-fullscreen-viewer__viewport--swipeable': canSwipe && !isSliding }"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <div class="product-expanded-slide-host">
        <Transition
          :name="slideTransitionName"
          @before-leave="onSlideStart"
          @after-enter="onSlideEnd"
        >
          <img
            :key="activeIndex"
            class="product-expanded-image mobile-fullscreen-viewer__image"
            :src="currentImage.image_url"
            :alt="currentImage.alt_text || imageAlt"
          />
        </Transition>
      </div>
    </div>

    <div
      v-if="showDots"
      class="mobile-fullscreen-viewer__dots"
      role="tablist"
      :aria-label="`${images.length} product images`"
    >
      <button
        v-for="(img, index) in images"
        :key="img._id || img.image_url || index"
        type="button"
        class="mobile-fullscreen-viewer__dot"
        :class="{ 'mobile-fullscreen-viewer__dot--active': index === activeIndex }"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-label="`Image ${index + 1} of ${images.length}`"
        @click.stop="$emit('go-to-index', index)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { isHorizontalSwipe } from '../../composables/useProductGalleryNav.js';
import ProductCloseButton from './ProductCloseButton.vue';
import ProductGalleryNavButton from './ProductGalleryNavButton.vue';

const props = defineProps({
  images: {
    type: Array,
    required: true
  },
  activeIndex: {
    type: Number,
    required: true
  },
  imageAlt: {
    type: String,
    default: 'Product image'
  },
  slideTransitionName: {
    type: String,
    required: true
  },
  isSliding: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'prev', 'next', 'go-to-index', 'slide-start', 'slide-end']);

const viewportRef = ref(null);

const CONTROL_SELECTOR =
  '.product-close-button, .product-floating-circle-button, .mobile-fullscreen-viewer__dot';

let swipeStartX = 0;
let swipeStartY = 0;
let touchSwipeActive = false;

const canSwipe = computed(() => props.images.length > 1);
const showDots = computed(() => props.images.length > 1);
const canGoPrev = computed(() => canSwipe.value);
const canGoNext = computed(() => canSwipe.value);
const currentImage = computed(() => props.images[props.activeIndex] || null);

function isControlTarget(target) {
  return target instanceof Element && Boolean(target.closest(CONTROL_SELECTOR));
}

function onSlideStart() {
  emit('slide-start');
}

function onSlideEnd() {
  emit('slide-end');
}

function onBackdropClick(event) {
  if (event.target.closest('.product-expanded-image')) {
    return;
  }
  if (isControlTarget(event.target)) {
    return;
  }
  emit('close');
}

function applySwipeDelta(deltaX) {
  if (!canSwipe.value || props.isSliding) return;
  if (deltaX < 0) {
    emit('next');
  } else {
    emit('prev');
  }
}

function onTouchStart(event) {
  if (!canSwipe.value || isControlTarget(event.target)) return;
  touchSwipeActive = true;
  swipeStartX = event.touches[0]?.clientX ?? 0;
  swipeStartY = event.touches[0]?.clientY ?? 0;
}

function onTouchEnd(event) {
  if (!canSwipe.value || !touchSwipeActive) return;
  touchSwipeActive = false;
  const endX = event.changedTouches[0]?.clientX ?? 0;
  const endY = event.changedTouches[0]?.clientY ?? 0;
  const deltaX = endX - swipeStartX;
  const deltaY = endY - swipeStartY;
  if (!isHorizontalSwipe(deltaX, deltaY, 40)) {
    return;
  }
  applySwipeDelta(deltaX);
}
</script>

<style scoped>
.mobile-fullscreen-viewer {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(255, 255, 255, 0.98);
  box-sizing: border-box;
  --mobile-viewer-top: calc(env(safe-area-inset-top, 0px) + var(--product-close-circle-size, clamp(2.25rem, 5vw, 2.75rem)) + 12px);
  --mobile-viewer-bottom: calc(env(safe-area-inset-bottom, 0px) + 36px);
  --mobile-viewer-inset-left: max(12px, env(safe-area-inset-left, 0px));
  --mobile-viewer-inset-right: max(12px, env(safe-area-inset-right, 0px));
}

.mobile-fullscreen-viewer :deep(.product-floating-circle-button--lightbox-prev) {
  left: max(8px, env(safe-area-inset-left, 0px));
  z-index: 3;
}

.mobile-fullscreen-viewer :deep(.product-floating-circle-button--lightbox-next) {
  right: max(8px, env(safe-area-inset-right, 0px));
  z-index: 3;
}

.mobile-fullscreen-viewer__viewport {
  position: absolute;
  top: var(--mobile-viewer-top);
  left: var(--mobile-viewer-inset-left);
  right: var(--mobile-viewer-inset-right);
  bottom: var(--mobile-viewer-bottom);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  /* Fullscreen does not scroll — claim horizontal for swipe, avoid dead vertical pans */
  touch-action: pan-x;
}

.mobile-fullscreen-viewer__viewport :deep(.product-expanded-slide-host) {
  touch-action: pan-x;
}

.mobile-fullscreen-viewer__viewport .product-expanded-slide-host {
  width: 100%;
  height: 100%;
}

.mobile-fullscreen-viewer__viewport--swipeable {
  cursor: grab;
  user-select: none;
}

.mobile-fullscreen-viewer__viewport--swipeable:active {
  cursor: grabbing;
}

.mobile-fullscreen-viewer__dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  z-index: 3;
  pointer-events: auto;
}

.mobile-fullscreen-viewer__dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 1px solid var(--color-text);
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
}

.mobile-fullscreen-viewer__dot--active {
  background: var(--color-text);
}
</style>
