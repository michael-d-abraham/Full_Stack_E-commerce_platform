<template>
  <span
    class="smart-image"
    :class="{
      'smart-image--ready': revealed || !fadeIn,
      'smart-image--error': errored,
      'smart-image--no-fade': !fadeIn,
      'smart-image--intrinsic': layout === 'intrinsic',
      'smart-image--fill': layout === 'fill'
    }"
    :style="frameStyle"
  >
    <img
      v-if="shouldShowImage(currentSrc, errored)"
      ref="imgRef"
      class="smart-image__img"
      :src="currentSrc"
      :srcset="srcset || undefined"
      :sizes="sizes || undefined"
      :alt="alt"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      :decoding="priority ? 'async' : 'async'"
      draggable="false"
      @load="onLoad"
      @error="onError"
    />
  </span>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { buildImageKitSrc, buildSrcSet, isImageKitUrl } from '../../utils/imageKitUrl.js';
import { preloadImageLink } from '../../utils/imagePrefetch.js';
import { shouldShowImage, shouldRetryUntransformed } from '../../utils/smartImagePolicy.js';

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  widths: {
    type: Array,
    default: () => [320, 640, 960, 1280]
  },
  sizes: {
    type: String,
    default: '100vw'
  },
  width: {
    type: Number,
    default: 960
  },
  priority: {
    type: Boolean,
    default: false
  },
  /** When false, skip opacity fade (e.g. gallery slide already animates). */
  fadeIn: {
    type: Boolean,
    default: true
  },
  aspectRatio: {
    type: [String, Number],
    default: null
  },
  /**
   * fill — stretch box (product stage/lightbox); image uses object-fit inside.
   * intrinsic — shrink-wrap natural aspect ratio (gallery cards / featured).
   */
  layout: {
    type: String,
    default: 'fill',
    validator: (value) => value === 'fill' || value === 'intrinsic'
  },
  objectFit: {
    type: String,
    default: 'contain',
    validator: (value) => ['contain', 'cover', 'fill', 'none', 'scale-down'].includes(value)
  }
});

const imgRef = ref(null);
const revealed = ref(!props.fadeIn);
const errored = ref(false);
const retried = ref(false);
const currentSrc = ref('');

const emit = defineEmits(['load', 'error']);

const srcset = computed(() => {
  if (!props.src || !isImageKitUrl(props.src)) {
    return '';
  }
  return buildSrcSet(props.src, props.widths, { quality: 80 });
});

const frameStyle = computed(() => {
  const style = {
    '--smart-image-fit': props.objectFit
  };
  if (props.aspectRatio != null) {
    style.aspectRatio =
      typeof props.aspectRatio === 'number' ? String(props.aspectRatio) : props.aspectRatio;
  }
  return style;
});

function resolveSrc(url) {
  if (!url) return '';
  if (!isImageKitUrl(url)) return url;
  // Width-only transform keeps ImageKit's default aspect-preserving resize (no crop).
  return buildImageKitSrc(url, { width: props.width, quality: 80 });
}

function revealIfComplete() {
  const el = imgRef.value;
  if (el?.complete && el.naturalWidth > 0) {
    revealed.value = true;
    return true;
  }
  return false;
}

function resetForSrc(url) {
  errored.value = false;
  retried.value = false;
  const next = resolveSrc(url);
  if (next === currentSrc.value && (revealed.value || !props.fadeIn)) {
    return;
  }
  currentSrc.value = next;
  if (!props.fadeIn) {
    revealed.value = true;
  } else {
    revealed.value = false;
  }
  if (props.priority && url) {
    preloadImageLink(url, { width: props.width });
  }
  if (!next) {
    return;
  }
  // Cached images often complete before the next paint — avoid a blank flash.
  nextTick(() => {
    revealIfComplete();
  });
}

async function onLoad(event) {
  errored.value = false;
  const el = imgRef.value;
  try {
    if (el?.decode) {
      await el.decode();
    }
  } catch {
    /* still show */
  }
  revealed.value = true;
  emit('load', event);
}

function onError(event) {
  if (shouldRetryUntransformed(retried.value, currentSrc.value, props.src)) {
    retried.value = true;
    currentSrc.value = props.src;
    return;
  }
  errored.value = true;
  revealed.value = false;
  emit('error', event);
}

defineExpose({
  imgEl: imgRef
});

watch(
  () => [props.src, props.width],
  ([url]) => {
    resetForSrc(url);
  },
  { immediate: true }
);

onMounted(() => {
  revealIfComplete();
});
</script>

<style scoped>
.smart-image {
  position: relative;
  display: block;
  min-height: 0;
  /* Transparent so gallery mats / stage backgrounds show through — no gray box. */
  background: transparent;
}

.smart-image--fill {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.smart-image--intrinsic {
  width: auto;
  height: auto;
  max-width: 100%;
  overflow: visible;
  line-height: 0;
}

.smart-image__img {
  display: block;
  object-fit: var(--smart-image-fit, contain);
  object-position: center;
  opacity: 0;
  transition: opacity var(--loading-reveal-ms, 180ms) ease;
}

.smart-image--fill .smart-image__img {
  width: 100%;
  height: 100%;
}

.smart-image--intrinsic .smart-image__img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

.smart-image--ready .smart-image__img,
.smart-image--no-fade .smart-image__img {
  opacity: 1;
}

.smart-image--no-fade .smart-image__img {
  transition: none;
}

.smart-image--error {
  background: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .smart-image__img {
    transition: none;
  }

  .smart-image--ready .smart-image__img {
    opacity: 1;
  }
}
</style>
