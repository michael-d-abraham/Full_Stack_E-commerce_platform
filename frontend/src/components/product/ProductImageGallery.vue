<template>
  <div class="product-image-gallery" :class="{ 'product-image-gallery--lightbox-open': lightboxOpen }">
    <div
      ref="stageRef"
      class="product-image-gallery__stage"
      :class="{ 'product-image-gallery__stage--lightbox-hidden': lightboxOpen }"
    >
      <ProductGalleryNavButton
        v-if="canSwipe && !useFloatingControls"
        direction="prev"
        context="overlay"
        :disabled="!canGoPrev || isSliding"
        @click.stop="goPrev"
      />
      <div
        ref="viewportRef"
        class="product-image-gallery__viewport"
        :class="{ 'product-image-gallery__viewport--swipeable': canSwipe && !isSliding }"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div v-if="currentImage" class="product-image-gallery__image-frame">
          <div class="product-image-gallery__slide-host">
            <Transition
              :name="slideTransitionName"
              @before-leave="onSlideStart"
              @after-enter="onSlideEnd"
            >
              <img
                :key="activeIndex"
                class="product-image-gallery__image product-image-gallery__slide-image"
                :src="currentImage.image_url"
                :alt="currentImage.alt_text || imageAlt"
                :loading="priority ? 'eager' : 'lazy'"
                :fetchpriority="priority ? 'high' : 'auto'"
              />
            </Transition>
          </div>
        </div>
        <p v-else class="product-image-gallery__empty">No image</p>
      </div>
      <ProductFloatingCircleButton
        v-if="currentImage && images.length && !useFloatingControls"
        icon="expand"
        placement="stage-enlarge"
        size="md"
        aria-label="View larger image"
        @click.stop="openLightbox"
      />
      <ProductGalleryNavButton
        v-if="canSwipe && !useFloatingControls"
        direction="next"
        context="overlay"
        :disabled="!canGoNext || isSliding"
        @click.stop="goNext"
      />
    </div>

    <Teleport :to="floatingControlsTarget" :disabled="!useFloatingControls">
      <div
        v-if="useFloatingControls && !lightboxOpen"
        class="product-image-gallery__floating-controls"
        :style="stageAnchorStyle"
      >
        <ProductGalleryNavButton
          v-if="canSwipe"
          direction="prev"
          context="overlay"
          :disabled="!canGoPrev || isSliding"
          @click.stop="goPrev"
        />
        <ProductFloatingCircleButton
          v-if="currentImage && images.length"
          icon="expand"
          placement="stage-enlarge"
          size="md"
          aria-label="View larger image"
          @click.stop="openLightbox"
        />
        <ProductGalleryNavButton
          v-if="canSwipe"
          direction="next"
          context="overlay"
          :disabled="!canGoNext || isSliding"
          @click.stop="goNext"
        />
      </div>
    </Teleport>

    <div
      v-if="showDots"
      class="product-image-gallery__dots"
      :class="{ 'product-image-gallery__dots--lightbox-hidden': lightboxOpen }"
      role="tablist"
      :aria-label="`${images.length} product images`"
    >
      <button
        v-for="(img, index) in images"
        :key="img._id || img.image_url || index"
        type="button"
        class="product-image-gallery__dot"
        :class="{ 'product-image-gallery__dot--active': index === activeIndex }"
        role="tab"
        :aria-selected="index === activeIndex"
        :aria-label="`Image ${index + 1} of ${images.length}`"
        @click="goToIndex(index)"
      />
    </div>

    <Teleport :to="teleportTarget">
      <Transition name="gallery-lightbox">
        <MobileFullscreenImageViewer
          v-if="lightboxOpen && currentImage && mobileFullscreenActive"
          :images="images"
          :active-index="activeIndex"
          :image-alt="imageAlt"
          :slide-transition-name="slideTransitionName"
          :is-sliding="isSliding"
          @close="closeLightbox"
          @prev="goPrev"
          @next="goNext"
          @go-to-index="goToIndex"
          @slide-start="onSlideStart"
          @slide-end="onSlideEnd"
        />
        <div
          v-else-if="lightboxOpen && currentImage"
          class="product-image-gallery__lightbox"
          :class="{ 'product-image-gallery__lightbox--contained': containedLightboxActive }"
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image"
          @click="onLightboxBackdropClick"
        >
          <ProductCloseButton
            v-if="!containedLightboxActive"
            class="product-image-gallery__lightbox-close"
            flush
            label="Close enlarged image"
            as-button
            @close="closeLightbox"
          />
          <div
            ref="lightboxStageRef"
            class="product-image-gallery__lightbox-stage"
            @touchstart.passive="onContainedLightboxTouchStart"
            @touchend.passive="onContainedLightboxTouchEnd"
            @pointerdown="onContainedLightboxPointerDown"
            @pointerup="onContainedLightboxPointerUp"
            @pointercancel="onContainedLightboxPointerUp"
          >
            <template v-if="containedLightboxActive">
              <ProductGalleryNavButton
                v-if="canSwipe"
                direction="prev"
                context="lightbox"
                :disabled="!canGoPrev || isSliding"
                @click.stop="goPrev"
              />
              <div class="product-image-gallery__lightbox-viewport product-image-gallery__lightbox-viewport--contained">
                <div class="product-expanded-slide-host">
                  <Transition
                    :name="slideTransitionName"
                    @before-leave="onSlideStart"
                    @after-enter="onSlideEnd"
                  >
                    <img
                      :key="activeIndex"
                      class="product-expanded-image product-image-gallery__slide-image"
                      :src="currentImage.image_url"
                      :alt="currentImage.alt_text || imageAlt"
                    />
                  </Transition>
                </div>
              </div>
              <ProductGalleryNavButton
                v-if="canSwipe"
                direction="next"
                context="lightbox"
                :disabled="!canGoNext || isSliding"
                @click.stop="goNext"
              />
            </template>
            <div
              v-else
              ref="lightboxViewportRef"
              class="product-image-gallery__lightbox-viewport"
              :class="{ 'product-image-gallery__lightbox-viewport--swipeable': canSwipe && !isSliding }"
              @touchstart.passive="onTouchStart"
              @touchend.passive="onTouchEnd"
              @pointerdown="onPointerDown"
              @pointerup="onPointerUp"
              @pointercancel="onPointerUp"
            >
              <ProductGalleryNavButton
                v-if="canSwipe"
                direction="prev"
                context="lightbox"
                :disabled="!canGoPrev || isSliding"
                @click.stop="goPrev"
              />
              <div class="product-expanded-slide-host">
                <Transition
                  :name="slideTransitionName"
                  @before-leave="onSlideStart"
                  @after-enter="onSlideEnd"
                >
                  <img
                    :key="activeIndex"
                    class="product-expanded-image product-image-gallery__slide-image"
                    :src="currentImage.image_url"
                    :alt="currentImage.alt_text || imageAlt"
                  />
                </Transition>
              </div>
              <ProductGalleryNavButton
                v-if="canSwipe"
                direction="next"
                context="lightbox"
                :disabled="!canGoNext || isSliding"
                @click.stop="goNext"
              />
            </div>
          </div>
          <div
            v-if="showDots"
            class="product-image-gallery__dots product-image-gallery__dots--lightbox"
            role="tablist"
            :aria-label="`${images.length} product images`"
          >
            <button
              v-for="(img, index) in images"
              :key="img._id || img.image_url || index"
              type="button"
              class="product-image-gallery__dot"
              :class="{ 'product-image-gallery__dot--active': index === activeIndex }"
              role="tab"
              :aria-selected="index === activeIndex"
              :aria-label="`Image ${index + 1} of ${images.length}`"
              @click="goToIndex(index)"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { isHorizontalSwipe } from '../../composables/useProductGalleryNav.js';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import { useFloatingControlsAnchor } from '../../composables/useFloatingControlsAnchor.js';
import ProductCloseButton from './ProductCloseButton.vue';
import ProductFloatingCircleButton from './ProductFloatingCircleButton.vue';
import ProductGalleryNavButton from './ProductGalleryNavButton.vue';
import MobileFullscreenImageViewer from './MobileFullscreenImageViewer.vue';

const props = defineProps({
  images: {
    type: Array,
    default: () => []
  },
  imageAlt: {
    type: String,
    default: 'Product image'
  },
  containedLightbox: {
    type: Boolean,
    default: false
  },
  lightboxTarget: {
    type: Object,
    default: null
  },
  priority: {
    type: Boolean,
    default: false
  },
  floatingControlsTarget: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['lightbox-change']);

const isMobile = useMediaQuery('(max-width: 640px)');
const activeIndex = ref(0);
const slideDirection = ref('next');
const isSliding = ref(false);
const lightboxOpen = ref(false);
const stageRef = ref(null);
const viewportRef = ref(null);
const lightboxStageRef = ref(null);
const lightboxViewportRef = ref(null);
const CONTROL_SELECTOR =
  '.product-floating-circle-button, .product-close-button, .product-image-gallery__dot, .product-image-gallery__floating-controls';

const useFloatingControls = computed(
  () => Boolean(props.floatingControlsTarget)
);

const { anchorStyle: stageAnchorStyle } = useFloatingControlsAnchor(stageRef, {
  enabled: () => useFloatingControls.value && !lightboxOpen.value
});

const containedLightboxActive = computed(
  () => props.containedLightbox && Boolean(props.lightboxTarget)
);

const mobileFullscreenActive = computed(
  () => isMobile.value && !containedLightboxActive.value
);

const teleportTarget = computed(() => {
  if (containedLightboxActive.value) {
    return props.lightboxTarget;
  }
  return 'body';
});

let swipeStartX = 0;
let swipeStartY = 0;
let pointerSwipeActive = false;
let touchSwipeActive = false;
let slideUnlockTimer = null;

const SLIDE_DURATION_MS = 260;

const slideTransitionName = computed(() => `gallery-slide-${slideDirection.value}`);

function isControlTarget(target) {
  return target instanceof Element && Boolean(target.closest(CONTROL_SELECTOR));
}

const canSwipe = computed(() => props.images.length > 1);
const showDots = computed(() => props.images.length > 1);
const canGoPrev = computed(() => canSwipe.value);
const canGoNext = computed(() => canSwipe.value);
const currentImage = computed(() => props.images[activeIndex.value] || null);

watch(
  () => props.images,
  () => {
    activeIndex.value = 0;
    lightboxOpen.value = false;
    isSliding.value = false;
    clearSlideUnlockTimer();
  }
);

function clearSlideUnlockTimer() {
  if (slideUnlockTimer != null) {
    clearTimeout(slideUnlockTimer);
    slideUnlockTimer = null;
  }
}

function onSlideStart() {
  isSliding.value = true;
  clearSlideUnlockTimer();
  slideUnlockTimer = setTimeout(() => {
    isSliding.value = false;
    slideUnlockTimer = null;
  }, SLIDE_DURATION_MS + 80);
}

function onSlideEnd() {
  clearSlideUnlockTimer();
  isSliding.value = false;
}

function setActiveIndex(index) {
  if (index === activeIndex.value || isSliding.value) {
    return;
  }
  if (index < 0 || index >= props.images.length) {
    return;
  }
  slideDirection.value = index > activeIndex.value ? 'next' : 'prev';
  activeIndex.value = index;
}

function goToIndex(index) {
  setActiveIndex(index);
}

function closeLightbox() {
  lightboxOpen.value = false;
}

function openLightbox() {
  if (!currentImage.value || lightboxOpen.value) {
    return;
  }
  lightboxOpen.value = true;
}

function onLightboxBackdropClick(event) {
  if (containedLightboxActive.value) {
    if (event.target === event.currentTarget) {
      closeLightbox();
    }
    return;
  }
  if (event.target === event.currentTarget) {
    closeLightbox();
  }
}

function onContainedLightboxTouchStart(event) {
  if (!containedLightboxActive.value) return;
  onTouchStart(event);
}

function onContainedLightboxTouchEnd(event) {
  if (!containedLightboxActive.value) return;
  onTouchEnd(event);
}

function onContainedLightboxPointerDown(event) {
  if (!containedLightboxActive.value) return;
  onPointerDown(event);
}

function onContainedLightboxPointerUp(event) {
  if (!containedLightboxActive.value) return;
  onPointerUp(event);
}

defineExpose({ closeLightbox });

function onLightboxEscape(event) {
  if (!lightboxOpen.value || event.key !== 'Escape') {
    return;
  }
  event.stopImmediatePropagation();
  closeLightbox();
}

function syncLightboxEscapeListener(open) {
  if (open) {
    window.addEventListener('keydown', onLightboxEscape, true);
  } else {
    window.removeEventListener('keydown', onLightboxEscape, true);
  }
}

watch(lightboxOpen, (open) => {
  emit('lightbox-change', open);
  syncLightboxEscapeListener(open);
});

function getPointerSurface() {
  if (!lightboxOpen.value) {
    return viewportRef.value;
  }
  if (containedLightboxActive.value) {
    return lightboxStageRef.value;
  }
  return lightboxViewportRef.value ?? lightboxStageRef.value;
}

function goNext() {
  if (!canSwipe.value || isSliding.value) {
    return;
  }
  slideDirection.value = 'next';
  activeIndex.value = activeIndex.value >= props.images.length - 1
    ? 0
    : activeIndex.value + 1;
}

function goPrev() {
  if (!canSwipe.value || isSliding.value) {
    return;
  }
  slideDirection.value = 'prev';
  activeIndex.value = activeIndex.value <= 0
    ? props.images.length - 1
    : activeIndex.value - 1;
}

function applySwipeDelta(deltaX) {
  if (!canSwipe.value || isSliding.value) return false;
  if (deltaX < 0) {
    goNext();
  } else {
    goPrev();
  }
  return true;
}

function onTouchStart(event) {
  if (isControlTarget(event.target)) return;
  touchSwipeActive = true;
  swipeStartX = event.touches[0]?.clientX ?? 0;
  swipeStartY = event.touches[0]?.clientY ?? 0;
}

function onTouchEnd(event) {
  if (!touchSwipeActive) return;
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

function onPointerDown(event) {
  if (event.pointerType === 'touch') return;
  if (event.button !== 0) return;
  if (isControlTarget(event.target)) return;

  pointerSwipeActive = true;
  swipeStartX = event.clientX;
  swipeStartY = event.clientY;
  if (canSwipe.value) {
    getPointerSurface()?.setPointerCapture?.(event.pointerId);
  }
}

function onPointerUp(event) {
  if (event.pointerType === 'touch') return;
  if (!pointerSwipeActive) return;

  pointerSwipeActive = false;
  const deltaX = event.clientX - swipeStartX;
  const deltaY = event.clientY - swipeStartY;
  if (isHorizontalSwipe(deltaX, deltaY, 40)) {
    applySwipeDelta(deltaX);
  }
  try {
    getPointerSurface()?.releasePointerCapture?.(event.pointerId);
  } catch {
    /* pointer may already be released */
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', onLightboxEscape, true);
  clearSlideUnlockTimer();
});
</script>

<style scoped>
.product-image-gallery--lightbox-open {
  pointer-events: none;
}

.product-image-gallery__stage--lightbox-hidden,
.product-image-gallery__dots--lightbox-hidden {
  visibility: hidden;
  pointer-events: none;
}
.product-image-gallery {
  width: 100%;
  margin-bottom: var(--space-lg);
}

.product-image-gallery__stage {
  position: relative;
  width: 100%;
  z-index: 1;
}

.product-image-gallery__floating-controls {
  box-sizing: border-box;
}

.product-image-gallery__floating-controls > :deep(.product-floating-circle-button) {
  pointer-events: auto;
}

.product-image-gallery__viewport {
  position: relative;
  width: 100%;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-product-image-bg);
  overflow: hidden;
  /* Vertical pans scroll the parent sheet; horizontal is free for gallery swipe */
  touch-action: pan-y pinch-zoom;
}

.product-image-gallery__viewport--swipeable {
  cursor: grab;
  user-select: none;
}

.product-image-gallery__viewport--swipeable:active {
  cursor: grabbing;
}

@media (max-width: 640px) {
  .product-image-gallery {
    margin-bottom: 0.75rem;
    --gallery-mobile-viewport-height: min(50svh, 380px);
  }

  .product-image-gallery__stage {
    overflow: visible;
    min-height: var(--gallery-mobile-viewport-height);
  }

  .product-image-gallery__viewport {
    height: var(--gallery-mobile-viewport-height);
    min-height: var(--gallery-mobile-viewport-height);
    max-height: var(--gallery-mobile-viewport-height);
    flex-shrink: 0;
    padding: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .product-image-gallery__image-frame {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    overflow: hidden;
    box-sizing: border-box;
  }

  .product-image-gallery__dots {
    margin-top: 10px;
  }
}

@media (min-width: 641px) {
  .product-image-gallery__viewport {
    height: min(52vh, 480px);
  }
}

.product-image-gallery__image {
  position: relative;
  z-index: 1;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  display: block;
  pointer-events: none;
}

.product-image-gallery__slide-host {
  position: relative;
  overflow: hidden;
  line-height: 0;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.product-image-gallery__slide-host .product-image-gallery__image {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: contain;
  object-position: center;
}

.product-image-gallery__image-frame {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.product-image-gallery__empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-transform: lowercase;
  letter-spacing: 0.06em;
}

.product-image-gallery__dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.product-image-gallery__dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1px solid var(--color-text);
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
}

.product-image-gallery__dot--active {
  background: var(--color-text);
}

.product-image-gallery__lightbox {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(var(--color-highlight-rgb), 0.96);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.product-image-gallery__lightbox--contained {
  position: absolute;
  inset: 0;
  z-index: 20;
  padding: 0;
  background: var(--color-product-image-bg, var(--color-highlight));
  pointer-events: auto;
}

.product-image-gallery__lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 4;
}

.product-image-gallery__lightbox-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.product-image-gallery__lightbox--contained .product-image-gallery__lightbox-stage {
  cursor: grab;
  user-select: none;
}

.product-image-gallery__lightbox--contained .product-image-gallery__lightbox-stage:active {
  cursor: grabbing;
}

.product-image-gallery__dots--lightbox {
  flex-shrink: 0;
  margin-top: 0;
  padding: 12px 0 16px;
}

.product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__dots--lightbox {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 0;
}

@media (min-width: 641px) {
  .product-image-gallery__lightbox--contained {
    display: flex;
    flex-direction: column;
  }

  .product-image-gallery__lightbox--contained .product-image-gallery__lightbox-stage {
    flex: 1;
    min-height: 0;
    width: 100%;
    height: 100%;
    align-items: stretch;
  }

  .product-image-gallery__lightbox-viewport--contained {
    flex: 1;
    min-width: 0;
    min-height: 0;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--color-product-image-bg, var(--color-highlight));
    touch-action: pan-y pinch-zoom;
  }

  .product-image-gallery__lightbox-viewport--contained .product-expanded-slide-host {
    width: 100%;
    height: 100%;
  }

  .product-image-gallery__lightbox--contained .product-image-gallery__dots--lightbox {
    flex-shrink: 0;
    position: static;
    padding: 12px 0 16px;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) {
    padding: 48px 56px 32px;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__lightbox-stage {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__lightbox-viewport {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(100%, 1100px);
    height: min(72vh, 720px);
    min-height: min(72vh, 720px);
    max-height: min(72vh, 720px);
    flex-shrink: 0;
    background: var(--color-product-image-bg, var(--color-highlight));
    overflow: hidden;
    box-sizing: border-box;
    touch-action: pan-y pinch-zoom;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-expanded-slide-host {
    flex: 1;
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__lightbox-viewport--swipeable {
    cursor: grab;
    user-select: none;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__lightbox-viewport--swipeable:active {
    cursor: grabbing;
  }

  .product-image-gallery__lightbox:not(.product-image-gallery__lightbox--contained) .product-image-gallery__dots--lightbox {
    position: static;
    flex-shrink: 0;
    margin-top: 16px;
    padding: 0;
  }
}

.product-image-gallery__slide-image {
  display: block;
}

.gallery-slide-next-enter-active,
.gallery-slide-next-leave-active,
.gallery-slide-prev-enter-active,
.gallery-slide-prev-leave-active {
  transition:
    transform var(--gallery-slide-duration, 0.26s) cubic-bezier(0.4, 0, 0.2, 1),
    opacity var(--gallery-slide-duration, 0.26s) cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  pointer-events: none;
  will-change: transform, opacity;
  z-index: 1;
}

.product-image-gallery__slide-host .gallery-slide-next-enter-active,
.product-image-gallery__slide-host .gallery-slide-next-leave-active,
.product-image-gallery__slide-host .gallery-slide-prev-enter-active,
.product-image-gallery__slide-host .gallery-slide-prev-leave-active {
  max-width: none;
  max-height: none;
}

.gallery-slide-next-leave-active,
.gallery-slide-prev-leave-active {
  z-index: 0;
}

.gallery-slide-next-enter-from {
  transform: translate3d(18%, 0, 0);
  opacity: 0;
}

.gallery-slide-next-leave-to {
  transform: translate3d(-18%, 0, 0);
  opacity: 0;
}

.gallery-slide-prev-enter-from {
  transform: translate3d(-18%, 0, 0);
  opacity: 0;
}

.gallery-slide-prev-leave-to {
  transform: translate3d(18%, 0, 0);
  opacity: 0;
}

.gallery-slide-next-enter-to,
.gallery-slide-next-leave-from,
.gallery-slide-prev-enter-to,
.gallery-slide-prev-leave-from {
  transform: translate3d(0, 0, 0);
  opacity: 1;
}

.gallery-lightbox-enter-active,
.gallery-lightbox-leave-active {
  transition: opacity 0.26s ease;
}

.gallery-lightbox-enter-from,
.gallery-lightbox-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .gallery-slide-next-enter-active,
  .gallery-slide-next-leave-active,
  .gallery-slide-prev-enter-active,
  .gallery-slide-prev-leave-active {
    --gallery-slide-duration: 0.01ms;
    transition: opacity 0.01ms linear;
    transform: none !important;
  }

  .gallery-slide-next-enter-from,
  .gallery-slide-next-leave-to,
  .gallery-slide-prev-enter-from,
  .gallery-slide-prev-leave-to {
    transform: none;
    opacity: 0;
  }

  .gallery-lightbox-enter-active,
  .gallery-lightbox-leave-active {
    transition: opacity 0.01ms linear;
  }
}
</style>
