<template>
  <div class="admin-home-preview">
    <section class="admin-home-preview__hero" aria-label="hero preview">
      <div class="admin-home-preview__hero-inner">
        <h3 class="admin-home-preview__block-title">landing slideshow</h3>
        <p class="admin-home-preview__field-hint">
          photos and videos cycle full-screen behind the landing text on the home page. order is top to bottom.
        </p>

        <label class="admin-home-preview__hero-signature-field">
          <span class="admin-home-preview__field-label">signature</span>
          <input
            v-model="form.hero_title"
            type="text"
            class="admin-home-preview__hero-signature-input"
            placeholder="handwritten signature"
            aria-label="hero signature"
            :disabled="disabled"
          />
        </label>

        <ul v-if="heroSlides.length" class="admin-home-preview__slides">
          <li
            v-for="(slide, index) in heroSlides"
            :key="`${slide.url}-${index}`"
            class="admin-home-preview__slide"
          >
            <span class="admin-home-preview__field-label">
              slide {{ index + 1 }}{{ slide.mediaType === 'video' ? ' (video)' : '' }}
            </span>
            <AdminHomePreviewImageSlot
              :image-url="slide.url"
              :media-type="slide.mediaType"
              :disabled="disabled"
              :aria-label="`slideshow ${slide.mediaType} ${index + 1}`"
              @pick="$emit('pick-image', { type: 'hero', index, mediaType: slide.mediaType })"
              @remove="$emit('remove-image', { type: 'hero', index })"
            />
          </li>
        </ul>

        <div class="admin-home-preview__add-actions">
          <button
            type="button"
            class="admin-home-preview__add-slide"
            :disabled="disabled || heroSlides.length >= maxSlides"
            @click="$emit('pick-image', { type: 'hero-add', mediaType: 'image' })"
          >
            add photo
          </button>
          <button
            type="button"
            class="admin-home-preview__add-slide"
            :disabled="disabled || heroSlides.length >= maxSlides"
            @click="$emit('pick-image', { type: 'hero-add', mediaType: 'video' })"
          >
            add video
          </button>
        </div>
        <p v-if="heroSlides.length >= maxSlides" class="admin-home-preview__field-hint">
          maximum {{ maxSlides }} slides.
        </p>
      </div>
    </section>

    <section class="admin-home-preview__about-me" aria-label="about me preview">
      <div class="admin-home-preview__container">
        <h3 class="admin-home-preview__block-title">about me</h3>
        <p class="admin-home-preview__field-hint">
          two tall photos that sit side by side on the home page, with vertical parallax.
        </p>
        <div class="admin-home-preview__about-me-pair">
          <div class="admin-home-preview__about-me-slot">
            <span class="admin-home-preview__field-label">left photo</span>
            <AdminHomePreviewImageSlot
              :image-url="form.about_me_left_image_url"
              :disabled="disabled"
              aria-label="about me left photo"
              @pick="$emit('pick-image', { type: 'about-me-left' })"
              @remove="$emit('remove-image', { type: 'about-me-left' })"
            />
          </div>
          <div class="admin-home-preview__about-me-slot">
            <span class="admin-home-preview__field-label">right photo</span>
            <AdminHomePreviewImageSlot
              :image-url="form.about_me_right_image_url"
              :disabled="disabled"
              aria-label="about me right photo"
              @pick="$emit('pick-image', { type: 'about-me-right' })"
              @remove="$emit('remove-image', { type: 'about-me-right' })"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { HERO_SLIDESHOW_MAX } from '../../constants/heroSlideshow.js';
import AdminHomePreviewImageSlot from './AdminHomePreviewImageSlot.vue';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
});

defineEmits(['pick-image', 'remove-image']);

const maxSlides = HERO_SLIDESHOW_MAX;
const heroSlides = computed(() => {
  const urls = Array.isArray(props.form?.hero_image_urls) ? props.form.hero_image_urls : [];
  const types = Array.isArray(props.form?.hero_media_types) ? props.form.hero_media_types : [];
  return urls.map((url, index) => ({
    url,
    mediaType: types[index] === 'video' ? 'video' : 'image'
  }));
});
</script>

<style scoped>
.admin-home-preview {
  width: 100%;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.admin-home-preview__block-title {
  margin: 0 0 var(--space-md);
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: lowercase;
  color: var(--color-text-muted);
}

.admin-home-preview__field-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.16em;
  color: var(--color-text-muted);
}

.admin-home-preview__hero {
  position: relative;
  overflow: hidden;
  padding: clamp(2rem, 5vh, 3.5rem) var(--space-lg);
  background: var(--color-highlight);
}

.admin-home-preview__hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
}

.admin-home-preview__field-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.admin-home-preview__hero-signature-field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xs);
  width: 100%;
  max-width: 18rem;
  margin-top: var(--space-lg);
}

.admin-home-preview__hero-signature-input {
  width: 100%;
  padding: 0.5rem 0;
  font-family: var(--font-script);
  font-size: clamp(1.35rem, 2.4vw, 1.75rem);
  font-weight: 400;
  letter-spacing: 0.01em;
  text-align: left;
  color: var(--color-heading);
  opacity: 0.72;
  border: none;
  border-bottom: 1px dashed var(--color-border);
  background: transparent;
}

.admin-home-preview__hero-signature-input:hover,
.admin-home-preview__hero-signature-input:focus {
  border-bottom-color: var(--color-accent);
  outline: none;
  opacity: 1;
}

.admin-home-preview__slides {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--space-md);
  margin: var(--space-lg) 0 0;
  padding: 0;
  list-style: none;
}

.admin-home-preview__slide {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.admin-home-preview__slide :deep(.admin-home-img-slot__hit) {
  aspect-ratio: 3 / 4;
  min-height: 12rem;
}

.admin-home-preview__slide :deep(.admin-home-img-slot__photo) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-home-preview__add-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.admin-home-preview__add-slide {
  margin-top: 0;
  padding: 0.55rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0;
  background: var(--color-paper);
  color: var(--color-text);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: lowercase;
  cursor: pointer;
}

.admin-home-preview__add-slide:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.admin-home-preview__container {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-home-preview__about-me {
  padding: var(--space-lg) var(--space-lg) var(--space-3xl);
  background: var(--color-bg);
}

.admin-home-preview__about-me-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

.admin-home-preview__about-me-slot {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.admin-home-preview__about-me-slot :deep(.admin-home-img-slot__hit) {
  aspect-ratio: 3 / 4;
  min-height: 16rem;
}

.admin-home-preview__about-me-slot :deep(.admin-home-img-slot__photo) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .admin-home-preview__hero,
  .admin-home-preview__about-me {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }

  .admin-home-preview__about-me-pair {
    grid-template-columns: 1fr;
  }

  .admin-home-preview__slides {
    grid-template-columns: 1fr;
  }
}
</style>
