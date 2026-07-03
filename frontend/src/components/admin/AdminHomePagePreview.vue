<template>
  <div class="admin-home-preview">
    <!-- Hero (mirrors HomeHero) -->
    <section class="admin-home-preview__hero hero-display" aria-label="Hero preview">
      <div class="admin-home-preview__hero-inner hero-display__inner">
        <div class="hero-display__stage admin-home-preview__hero-stage">
          <AdminHomePreviewImageSlot
            class="admin-home-preview__hero-image-wrap"
            :image-url="form.hero_image_url"
            :disabled="disabled"
            natural-display
            photo-class="hero-display__photo"
            aria-label="Hero image"
            @pick="$emit('pick-image', { type: 'hero' })"
            @remove="$emit('remove-image', { type: 'hero' })"
          />
          <div class="hero-display__overlay admin-home-preview__hero-overlay">
            <div class="hero-display__overlay-scrim" aria-hidden="true" />
            <div class="hero-display__overlay-content">
              <span class="hero-display__overlay-link hero-display__overlay-link--static">
                View Collection →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured (mirrors HomeFeaturedProducts) -->
    <section class="admin-home-preview__featured" aria-label="Featured products preview">
      <div class="admin-home-preview__container">
        <input
          v-model="form.featured_title"
          type="text"
          class="admin-home-preview__section-title page-hero-title"
          placeholder="Featured products"
          aria-label="Featured section title"
        />
        <div class="admin-home-preview__featured-grid">
          <AdminHomeFeaturedSlot
            v-for="(item, index) in form.featured_products"
            :key="'preview-featured-' + index"
            :product-id="item.product_id"
            :slot-number="index + 1"
            :mobile-only="index < 3"
            :catalog-products="catalogProducts"
            :taken-product-ids="takenFeaturedProductIds"
            :disabled="disabled"
            @update:product-id="item.product_id = $event"
          />
        </div>
      </div>
    </section>

    <!-- About (mirrors HomeAboutSection) -->
    <section class="admin-home-preview__about" aria-label="About preview">
      <div class="admin-home-preview__container admin-home-preview__about-inner">
        <header class="admin-home-preview__about-masthead">
          <input
            v-model="form.about_title"
            type="text"
            class="admin-home-preview__about-name"
            placeholder="Artist name"
            aria-label="Artist name"
            :disabled="disabled"
          />
          <div class="admin-home-preview__about-divider" aria-hidden="true" />
        </header>
        <div class="admin-home-preview__about-grid">
          <label class="admin-home-preview__about-quote-field">
            <span class="admin-home-preview__about-text-label">Quote</span>
            <textarea
              v-model="form.about_header"
              class="admin-home-preview__about-quote-input"
              rows="4"
              placeholder="A bold quote that defines the artist"
              aria-label="Artist quote"
              :disabled="disabled"
            />
          </label>

          <AdminHomePreviewImageSlot
            class="admin-home-preview__about-image-wrap"
            :image-url="form.about_image_url"
            :disabled="disabled"
            natural-display
            aria-label="Artist portrait"
            @pick="$emit('pick-image', { type: 'about' })"
            @remove="$emit('remove-image', { type: 'about' })"
          />

          <label class="admin-home-preview__about-text-field">
            <span class="admin-home-preview__about-text-label">Artist statement</span>
            <textarea
              v-model="form.about_text"
              class="admin-home-preview__about-text-input"
              rows="5"
              placeholder="A concise artist statement (3–5 sentences)"
              aria-label="Artist statement"
              :disabled="disabled"
            />
          </label>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import AdminHomePreviewImageSlot from './AdminHomePreviewImageSlot.vue';
import AdminHomeFeaturedSlot from './AdminHomeFeaturedSlot.vue';

const props = defineProps({
  form: { type: Object, required: true },
  catalogProducts: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false }
});

defineEmits(['pick-image', 'remove-image']);

const takenFeaturedProductIds = computed(() =>
  props.form.featured_products
    .map((row) => (row.product_id ? String(row.product_id) : ''))
    .filter(Boolean)
);
</script>

<style scoped>
.admin-home-preview {
  width: 100%;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

/* —— Hero (uses hero-display.css for image scale limits) —— */
.admin-home-preview__hero {
  padding: var(--space-lg) var(--space-lg) var(--space-2xl);
}

.admin-home-preview__hero-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.admin-home-preview__hero-image-wrap {
  width: auto;
  max-width: 100%;
}

.admin-home-preview__hero-stage {
  line-height: 0;
}

.admin-home-preview__hero-overlay {
  pointer-events: none;
}

.admin-home-preview__hero-overlay .hero-display__overlay-content {
  pointer-events: auto;
}

.admin-home-preview__hero-image-wrap :deep(.admin-home-img-slot__hit:not(:has(.admin-home-img-slot__photo))) {
  aspect-ratio: 16 / 9;
  min-height: 200px;
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

/* —— Featured —— */
.admin-home-preview__featured {
  padding: var(--space-lg) var(--space-lg) var(--space-3xl);
}

.admin-home-preview__featured .admin-home-preview__container {
  max-width: 1100px;
}

.admin-home-preview__featured-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-lg);
  align-items: start;
}

/* —— About —— */
.admin-home-preview__about {
  padding: 0 var(--space-lg) var(--space-3xl);
  background: #faf8f3;
  border-top: 1px solid var(--color-border);
}

.admin-home-preview__about-inner {
  padding-top: var(--space-xl);
}

.admin-home-preview__about-masthead {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.admin-home-preview__about-name {
  display: block;
  width: 100%;
  margin: 0 0 var(--space-md);
  padding: 0.25rem 0.5rem;
  border: 1px dashed transparent;
  background: transparent;
  box-shadow: none;
  font-family: var(--font-sans);
  font-size: clamp(0.9375rem, 2vw, 1.25rem);
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-align: center;
  color: var(--color-text);
}

.admin-home-preview__about-name:hover,
.admin-home-preview__about-name:focus {
  border-color: var(--color-border);
  outline: none;
}

.admin-home-preview__about-divider {
  width: 3.5rem;
  height: 1px;
  margin: 0 auto;
  background: currentColor;
  opacity: 0.28;
}

.admin-home-preview__about-grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  grid-template-areas:
    'quote portrait'
    'statement portrait';
  gap: var(--space-lg) clamp(var(--space-xl), 4vw, var(--space-2xl));
  align-items: start;
}

.admin-home-preview__about-quote-field {
  grid-area: quote;
}

.admin-home-preview__about-text-field {
  grid-area: statement;
}

.admin-home-preview__about-image-wrap {
  grid-area: portrait;
  grid-row: 1 / -1;
  width: 100%;
}

.admin-home-preview__about-quote-field,
.admin-home-preview__about-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.admin-home-preview__about-quote-input {
  width: 100%;
  min-height: 8rem;
  padding: var(--space-sm) 0;
  font-family: inherit;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: var(--color-text);
  border: 1px dashed var(--color-border);
  background: transparent;
  resize: vertical;
}

.admin-home-preview__about-quote-input:hover,
.admin-home-preview__about-quote-input:focus {
  border-color: var(--color-text);
  outline: none;
}

.admin-home-preview__about-text-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-text-muted);
}

.admin-home-preview__about-text-input {
  width: 100%;
  min-height: 8rem;
  padding: var(--space-md);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--color-text);
  border: 1px dashed var(--color-border);
  background: transparent;
  resize: vertical;
}

.admin-home-preview__about-text-input:hover,
.admin-home-preview__about-text-input:focus {
  border-color: var(--color-text);
  outline: none;
}

.admin-home-preview__about-image-wrap :deep(.admin-home-img-slot__hit:not(:has(.admin-home-img-slot__photo))) {
  aspect-ratio: 4 / 5;
  min-height: 280px;
}

@media (min-width: 641px) {
  .admin-home-preview__hero-inner {
    max-width: none;
    width: 100%;
  }

  .admin-home-preview__section-title {
    margin-top: 0;
  }

  .admin-home-preview__about-inner {
    max-width: none;
    width: min(90vw, 75rem);
  }
}

@media (max-width: 900px) {
  .admin-home-preview__featured-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .admin-home-preview__hero,
  .admin-home-preview__featured,
  .admin-home-preview__about {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }

  .admin-home-preview__featured-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .admin-home-preview__hero-image-wrap :deep(.admin-home-img-slot__hit:not(:has(.admin-home-img-slot__photo))) {
    aspect-ratio: 4 / 3;
  }

  .admin-home-preview__about-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'portrait'
      'quote'
      'statement';
    gap: var(--space-xl);
  }

  .admin-home-preview__about-image-wrap {
    grid-row: auto;
  }

  .admin-home-preview__about-inner {
    padding-top: var(--space-lg);
  }
}
</style>
