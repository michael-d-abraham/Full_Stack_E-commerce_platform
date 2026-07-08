<template>
  <div class="product-image-frame">
    <div class="gallery-art-frame" :class="orientation">
      <div class="gallery-art-mat">
        <img
          v-if="src"
          ref="imageRef"
          class="product-image gallery-art-image"
          :src="src"
          :alt="alt"
          :loading="loading"
          @load="onImageLoad"
        />
        <span v-else class="product-image product-image--placeholder gallery-art-image">{{ placeholder }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useGalleryArtOrientation } from '../../composables/useGalleryArtOrientation.js';

defineProps({
  src: { type: String, default: '' },
  alt: { type: String, required: true },
  loading: {
    type: String,
    default: 'lazy',
    validator: (value) => value === 'lazy' || value === 'eager'
  },
  placeholder: { type: String, default: 'No image' }
});

const imageRef = ref(null);
const { orientation, onImageLoad } = useGalleryArtOrientation(imageRef);
</script>
