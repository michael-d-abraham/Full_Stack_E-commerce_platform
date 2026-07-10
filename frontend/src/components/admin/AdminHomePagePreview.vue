<template>
  <div class="admin-home-preview">
    <!-- Hero (mirrors HomeHero — quote + signature only) -->
    <section class="admin-home-preview__hero" aria-label="Hero preview">
      <div class="admin-home-preview__hero-inner">
        <h3 class="admin-home-preview__block-title">Hero section</h3>

        <div class="admin-home-preview__hero-stage">
          <label class="admin-home-preview__hero-quote-field">
            <span class="admin-home-preview__field-label">Hero quote</span>
            <textarea
              v-model="form.hero_quote"
              class="admin-home-preview__hero-quote-input"
              rows="4"
              placeholder="Art is how we decorate space. Music is how we decorate time."
              aria-label="Hero quote"
              :disabled="disabled"
            />
          </label>

          <label class="admin-home-preview__hero-signature-field">
            <span class="admin-home-preview__field-label">Signature</span>
            <input
              v-model="form.hero_title"
              type="text"
              class="admin-home-preview__hero-signature-input"
              placeholder="Handwritten signature"
              aria-label="Hero signature"
              :disabled="disabled"
            />
          </label>
        </div>
      </div>
    </section>

    <!-- Featured (mirrors HomeFeaturedProducts) -->
    <section
      class="admin-home-preview__featured"
      :class="{ 'admin-home-preview__section--has-background': Boolean(form.featured_background_image_url) }"
      aria-label="Featured products preview"
    >
      <div
        v-if="form.featured_background_image_url"
        class="admin-home-preview__section-background"
        :style="{ backgroundImage: `url(${form.featured_background_image_url})` }"
        aria-hidden="true"
      />
      <div class="admin-home-preview__container">
        <h3 class="admin-home-preview__block-title">Featured section</h3>

        <div class="admin-home-preview__section-background-field">
          <span class="admin-home-preview__field-label">Featured background texture</span>
          <p class="admin-home-preview__field-hint">
            Full-bleed texture behind the featured section.
          </p>
          <AdminHomePreviewImageSlot
            class="admin-home-preview__section-background-slot"
            :image-url="form.featured_background_image_url"
            :disabled="disabled"
            aria-label="Featured section background texture"
            @pick="$emit('pick-image', { type: 'featured-background' })"
            @remove="$emit('remove-image', { type: 'featured-background' })"
          />
        </div>

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
        <p class="admin-home-preview__featured-cta">
          <span class="admin-home-preview__featured-cta-link">View Collection</span>
        </p>
      </div>
    </section>

    <!-- About (mirrors HomeAboutSection) -->
    <section
      class="admin-home-preview__about"
      :class="{ 'admin-home-preview__section--has-background': Boolean(form.about_background_image_url) }"
      aria-label="About preview"
    >
      <div
        v-if="form.about_background_image_url"
        class="admin-home-preview__section-background"
        :style="{ backgroundImage: `url(${form.about_background_image_url})` }"
        aria-hidden="true"
      />
      <div class="admin-home-preview__container admin-home-preview__about-inner">
        <h3 class="admin-home-preview__block-title">About section</h3>

        <div class="admin-home-preview__section-background-field">
          <span class="admin-home-preview__field-label">About background texture</span>
          <p class="admin-home-preview__field-hint">
            Full-bleed texture behind the about section.
          </p>
          <AdminHomePreviewImageSlot
            class="admin-home-preview__section-background-slot"
            :image-url="form.about_background_image_url"
            :disabled="disabled"
            aria-label="About section background texture"
            @pick="$emit('pick-image', { type: 'about-background' })"
            @remove="$emit('remove-image', { type: 'about-background' })"
          />
        </div>

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
            <span class="admin-home-preview__field-label">About quote</span>
            <textarea
              v-model="form.about_header"
              class="admin-home-preview__about-quote-input"
              rows="4"
              placeholder="A bold quote that defines the artist"
              aria-label="About quote"
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

.admin-home-preview__block-title {
  margin: 0 0 var(--space-md);
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.admin-home-preview__field-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-text-muted);
}

/* —— Hero (museum quote + signature) —— */
.admin-home-preview__hero {
  position: relative;
  overflow: hidden;
  padding: clamp(3rem, 8vh, 5rem) var(--space-lg);
  background: #ffffff;
}

.admin-home-preview__hero-inner {
  position: relative;
  z-index: 1;
  max-width: 42rem;
  margin: 0 auto;
}

.admin-home-preview__hero-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(1.75rem, 4vh, 2.75rem);
  width: 100%;
  text-align: center;
  min-height: 18rem;
  justify-content: center;
}

.admin-home-preview__section-background-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.admin-home-preview__section-background {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
}

.admin-home-preview__featured,
.admin-home-preview__about {
  position: relative;
  overflow: hidden;
}

.admin-home-preview__featured .admin-home-preview__container,
.admin-home-preview__about .admin-home-preview__about-inner {
  position: relative;
  z-index: 1;
}

.admin-home-preview__section-background-slot :deep(.admin-home-img-slot__hit) {
  aspect-ratio: 21 / 9;
  min-height: 120px;
}

.admin-home-preview__section-background-slot :deep(.admin-home-img-slot__photo) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-home-preview__field-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.admin-home-preview__hero-quote-field,
.admin-home-preview__hero-signature-field {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.admin-home-preview__hero-quote-input {
  width: 100%;
  min-height: 8rem;
  padding: var(--space-sm) 0;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 300;
  line-height: 1.15;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
  font-variant: small-caps;
  color: #000000;
  border: 1px dashed var(--color-border);
  background: transparent;
  resize: vertical;
}

.admin-home-preview__hero-quote-input:hover,
.admin-home-preview__hero-quote-input:focus {
  border-color: #000000;
  outline: none;
}

.admin-home-preview__hero-signature-input {
  width: min(100%, 18rem);
  padding: 0.5rem 0;
  font-family: var(--font-script);
  font-size: clamp(1.35rem, 2.4vw, 1.75rem);
  font-weight: 400;
  letter-spacing: 0.01em;
  text-align: center;
  color: #000000;
  opacity: 0.72;
  border: none;
  border-bottom: 1px dashed var(--color-border);
  background: transparent;
}

.admin-home-preview__hero-signature-input:hover,
.admin-home-preview__hero-signature-input:focus {
  border-bottom-color: #000000;
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

.admin-home-preview__featured-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--space-xl) 0 0;
  padding: 0;
  width: 100%;
  text-align: center;
  line-height: normal;
}

.admin-home-preview__featured-cta-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50vw;
  max-width: 100%;
  min-width: 0;
  min-height: 64px;
  padding: 0 3rem;
  border: 1px solid var(--color-text);
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  box-sizing: border-box;
  opacity: 0.88;
}

/* —— About —— */
.admin-home-preview__about {
  padding: var(--space-lg) var(--space-lg) var(--space-3xl);
  background: #faf8f3;
}

.admin-home-preview__about-inner {
  padding-top: var(--space-lg);
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
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(0.9375rem, 2vw, 1.25rem);
  font-weight: 300;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  font-variant: small-caps;
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
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 300;
  line-height: 1.15;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant: small-caps;
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
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.7;
  letter-spacing: 0.03em;
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
    max-width: 42rem;
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

  .admin-home-preview__featured-cta {
    margin-top: var(--space-lg);
  }

  .admin-home-preview__hero-stage {
    min-height: 14rem;
  }

  .admin-home-preview__hero {
    padding-top: var(--space-xl);
    padding-bottom: var(--space-xl);
  }

  .admin-home-preview__featured {
    padding-top: var(--space-xl);
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
