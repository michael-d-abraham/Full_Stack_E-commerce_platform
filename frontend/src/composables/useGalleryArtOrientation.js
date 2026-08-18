import { nextTick, onMounted, ref } from 'vue';

const ORIENTATION_LANDSCAPE = 'gallery-art--landscape';
const ORIENTATION_PORTRAIT = 'gallery-art--portrait';
const ORIENTATION_SQUARE = 'gallery-art--square';

export function resolveGalleryArtMax(value, referenceWidth) {
  if (!value) {
    return Infinity;
  }

  const normalized = value.trim();
  if (normalized.endsWith('px')) {
    return parseFloat(normalized);
  }

  if (normalized.startsWith('min(') && normalized.endsWith(')')) {
    const parts = normalized.slice(4, -1).split(',').map((part) => part.trim());
    return Math.min(...parts.map((part) => resolveGalleryArtMax(part, referenceWidth)));
  }

  if (normalized === '100%') {
    return referenceWidth;
  }

  const calcMatch = normalized.match(/^calc\(100%\s*-\s*(\d+(?:\.\d+)?)px\)$/);
  if (calcMatch) {
    return referenceWidth - parseFloat(calcMatch[1]);
  }

  return Infinity;
}

export function getGalleryArtOrientation(naturalWidth, naturalHeight) {
  const ratio = naturalWidth / naturalHeight;
  if (ratio > 1.12) {
    return ORIENTATION_LANDSCAPE;
  }
  if (ratio < 0.88) {
    return ORIENTATION_PORTRAIT;
  }
  return ORIENTATION_SQUARE;
}

export function fitGalleryArtDimensions(naturalWidth, naturalHeight, maxWidth, maxHeight) {
  const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight);
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale))
  };
}

export function applyGalleryArtOrientation(img, orientationRef) {
  if (!img?.naturalWidth || !img?.naturalHeight) {
    return;
  }
  const ratio = img.naturalWidth / img.naturalHeight;
  if (ratio > 1.12) {
    orientationRef.value = ORIENTATION_LANDSCAPE;
    return;
  }
  if (ratio < 0.88) {
    orientationRef.value = ORIENTATION_PORTRAIT;
    return;
  }
  orientationRef.value = ORIENTATION_SQUARE;
}

export function useGalleryArtOrientation(imageRef) {
  const orientation = ref(ORIENTATION_SQUARE);

  function onImageLoad(event) {
    applyGalleryArtOrientation(event.target, orientation);
  }

  onMounted(() => {
    nextTick(() => {
      if (imageRef.value?.complete) {
        applyGalleryArtOrientation(imageRef.value, orientation);
      }
    });
  });

  return {
    orientation,
    onImageLoad
  };
}
