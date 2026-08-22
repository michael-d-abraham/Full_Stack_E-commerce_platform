<template>
  <div class="admin-home-preview">
    <!-- Hero pair (mirrors HomeHero + reversed HomeHero) -->
    <section class="admin-home-preview__hero" aria-label="hero preview">
      <div class="admin-home-preview__hero-inner">
        <h3 class="admin-home-preview__block-title">hero section</h3>
        <p class="admin-home-preview__field-hint">
          two pages. first is madd with its own photo. second flips the layout and uses a separate .lines photo.
        </p>

        <div class="admin-home-preview__hero-grid">
          <div class="admin-home-preview__hero-copy">
            <p class="admin-home-preview__hero-word">madd</p>
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
          </div>

          <div class="admin-home-preview__hero-photo">
            <span class="admin-home-preview__field-label">madd photo</span>
            <AdminHomePreviewImageSlot
              :image-url="form.hero_image_url"
              :disabled="disabled"
              aria-label="madd photo"
              @pick="$emit('pick-image', { type: 'hero' })"
              @remove="$emit('remove-image', { type: 'hero' })"
            />
          </div>
        </div>

        <div class="admin-home-preview__hero-grid admin-home-preview__hero-grid--reversed">
          <div class="admin-home-preview__hero-photo">
            <span class="admin-home-preview__field-label">.lines photo</span>
            <AdminHomePreviewImageSlot
              :image-url="form.hero_lines_image_url"
              :disabled="disabled"
              aria-label=".lines photo"
              @pick="$emit('pick-image', { type: 'hero-lines' })"
              @remove="$emit('remove-image', { type: 'hero-lines' })"
            />
          </div>

          <div class="admin-home-preview__hero-copy">
            <p class="admin-home-preview__hero-word">.lines</p>
          </div>
        </div>
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
import AdminHomePreviewImageSlot from './AdminHomePreviewImageSlot.vue';

defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
});

defineEmits(['pick-image', 'remove-image']);
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

/* —— Hero (madd left / photo right, then photo left / .lines right) —— */
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

.admin-home-preview__hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-lg);
  align-items: stretch;
  width: 100%;
  margin-top: var(--space-md);
}

.admin-home-preview__hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: clamp(1.25rem, 3vh, 2rem);
  min-width: 0;
  text-align: center;
}

.admin-home-preview__hero-word {
  margin: 0;
  padding: 0 0 0 0.08em;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(1.85rem, 3.6vw, 3rem);
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: 0.08em;
  text-transform: lowercase;
  color: var(--color-text);
}

.admin-home-preview__hero-grid--reversed {
  margin-top: var(--space-2xl);
}

.admin-home-preview__hero-photo {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.admin-home-preview__hero-photo :deep(.admin-home-img-slot__hit) {
  aspect-ratio: 3 / 4;
  min-height: 20rem;
}

.admin-home-preview__hero-photo :deep(.admin-home-img-slot__photo) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-home-preview__about-me {
  position: relative;
  overflow: hidden;
}

.admin-home-preview__field-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.admin-home-preview__hero-signature-field {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.admin-home-preview__hero-signature-input {
  width: min(100%, 18rem);
  padding: 0.5rem 0;
  font-family: var(--font-script);
  font-size: clamp(1.35rem, 2.4vw, 1.75rem);
  font-weight: 400;
  letter-spacing: 0.01em;
  text-align: center;
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

/* —— Shared container —— */
.admin-home-preview__container {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-home-preview__section-title {
  display: block;
  width: 100%;
  margin: 0 0 var(--space-xl);
  font-size: clamp(1.25rem, 3.25vw, 1.875rem);
  padding: 0.25rem 0.5rem;
  border: 1px dashed transparent;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  text-align: center;
}

.admin-home-preview__section-title:hover,
.admin-home-preview__section-title:focus {
  border-color: var(--color-border);
  outline: none;
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

@media (min-width: 641px) {
  .admin-home-preview__hero-inner {
    max-width: 1100px;
    width: 100%;
  }

  .admin-home-preview__section-title {
    margin-top: 0;
  }

}

@media (max-width: 640px) {
  .admin-home-preview__hero,
  .admin-home-preview__about-me {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }

  .admin-home-preview__about-me-pair {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .admin-home-preview__hero-grid {
    grid-template-columns: 1fr;
  }

  .admin-home-preview__hero-grid--reversed .admin-home-preview__hero-photo {
    order: -1;
  }

  .admin-home-preview__hero-photo :deep(.admin-home-img-slot__hit) {
    min-height: 16rem;
  }

  .admin-home-preview__hero {
    padding-top: var(--space-xl);
    padding-bottom: var(--space-xl);
  }

}
</style>
