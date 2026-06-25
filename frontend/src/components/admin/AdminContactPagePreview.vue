<template>
  <div class="admin-contact-preview contact-page">
    <label class="admin-contact-preview__checkbox admin-contact-preview__nav-toggle">
      <input
        v-model="form.show_in_nav"
        type="checkbox"
        :disabled="disabled"
      />
      <span>Show Contact tab in navigation</span>
    </label>

    <input
      v-model="form.page_title"
      type="text"
      class="admin-contact-preview__title-input page-hero-title"
      placeholder="Contact"
      aria-label="Page title"
      :disabled="disabled"
    />

    <div
      class="contact-page__layout admin-contact-preview__layout"
      :class="{ 'contact-page__layout--no-hero': !form.show_hero_image }"
    >
      <div class="admin-contact-preview__media-col">
        <div v-if="form.show_hero_image" class="contact-page__hero">
          <AdminHomePreviewImageSlot
            class="admin-contact-preview__hero-slot"
            :image-url="form.contact_hero_image_url"
            :disabled="disabled"
            aria-label="Portrait next to form"
            @pick="$emit('pick-image', { type: 'hero' })"
            @remove="$emit('remove-image', { type: 'hero' })"
          />
        </div>

        <label class="admin-contact-preview__checkbox">
          <input
            v-model="form.show_hero_image"
            type="checkbox"
            :disabled="disabled"
          />
          <span>Show portrait image next to the contact form</span>
        </label>
      </div>

      <form
        class="form contact-page__form admin-contact-preview__form"
        @submit.prevent
      >
        <label>
          <input
            v-model="form.form_name_label"
            type="text"
            class="admin-contact-preview__label-input"
            placeholder="Name"
            aria-label="Name field label"
            :disabled="disabled"
          />
          <input type="text" disabled tabindex="-1" aria-hidden="true">
        </label>
        <label>
          <input
            v-model="form.form_email_label"
            type="text"
            class="admin-contact-preview__label-input"
            placeholder="Your email"
            aria-label="Email field label"
            :disabled="disabled"
          />
          <input type="email" disabled tabindex="-1" aria-hidden="true">
        </label>
        <label>
          <input
            v-model="form.form_subject_label"
            type="text"
            class="admin-contact-preview__label-input"
            placeholder="Subject"
            aria-label="Subject field label"
            :disabled="disabled"
          />
          <input type="text" disabled tabindex="-1" aria-hidden="true">
        </label>
        <label>
          <input
            v-model="form.form_message_label"
            type="text"
            class="admin-contact-preview__label-input"
            placeholder="Message"
            aria-label="Message field label"
            :disabled="disabled"
          />
          <textarea rows="6" disabled tabindex="-1" aria-hidden="true" />
        </label>
        <input
          v-model="form.form_submit_label"
          type="text"
          class="admin-contact-preview__submit-input btn-primary"
          placeholder="Submit"
          aria-label="Submit button label"
          :disabled="disabled"
        />
      </form>
    </div>
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
.admin-contact-preview {
  width: 100%;
  padding: var(--space-md) var(--space-lg) var(--space-lg);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.admin-contact-preview__nav-toggle {
  margin-bottom: var(--space-lg);
}

.admin-contact-preview__title-input {
  display: block;
  width: 100%;
  border: 1px dashed transparent;
  background: transparent;
  cursor: text;
}

.admin-contact-preview__title-input:hover,
.admin-contact-preview__title-input:focus {
  border-color: var(--color-border);
  outline: none;
  box-shadow: none;
}

/* Match live Contact page width (app-main__inner uses --max-width-page) */
.admin-contact-preview__layout {
  max-width: var(--max-width-page);
  margin-inline: auto;
  width: 100%;
}

.admin-contact-preview__media-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

@media (min-width: 48rem) {
  .admin-contact-preview__layout:not(.contact-page__layout--no-hero) .admin-contact-preview__media-col {
    max-width: calc(var(--max-width-page) - var(--max-width-narrow) - var(--space-2xl));
  }

  .admin-contact-preview .contact-page__hero {
    width: 100%;
    max-width: 100%;
  }
}

.admin-contact-preview__hero-slot :deep(.admin-home-img-slot) {
  width: 100%;
  height: 100%;
}

.admin-contact-preview__hero-slot :deep(.admin-home-img-slot__hit) {
  width: 100%;
  height: 100%;
  min-height: 0;
  aspect-ratio: unset;
  max-height: none;
}

.admin-contact-preview__hero-slot :deep(.admin-home-img-slot__hit:has(.admin-home-img-slot__photo)) {
  border: none;
  background: transparent;
}

.admin-contact-preview__hero-slot :deep(.admin-home-img-slot__photo) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.admin-contact-preview__checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: none;
  color: var(--color-text);
  cursor: pointer;
}

.admin-contact-preview__checkbox input {
  width: auto;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.admin-contact-preview__layout.contact-page__layout--no-hero .admin-contact-preview__media-col {
  max-width: var(--max-width-narrow);
  margin: 0 auto;
  width: 100%;
}

.admin-contact-preview__form label {
  cursor: default;
}

.admin-contact-preview__label-input {
  width: 100%;
  margin: 0;
  padding: 0;
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.4;
  color: var(--color-text);
  border: 1px dashed transparent;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  cursor: text;
}

.admin-contact-preview__label-input:hover,
.admin-contact-preview__label-input:focus {
  border-color: var(--color-border);
  outline: none;
  box-shadow: none;
}

.admin-contact-preview__form input:disabled:not(.admin-contact-preview__label-input),
.admin-contact-preview__form textarea:disabled {
  opacity: 1;
  cursor: default;
  pointer-events: none;
  color: var(--color-text-muted);
  text-transform: none;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.admin-contact-preview__submit-input {
  align-self: flex-start;
  margin-top: var(--space-xs);
  min-height: 44px;
  min-width: 8rem;
  padding: 0.65rem 1.5rem;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  line-height: inherit;
  text-align: center;
  cursor: text;
  border-style: dashed;
}

.admin-contact-preview__submit-input:hover,
.admin-contact-preview__submit-input:focus {
  outline: none;
  box-shadow: var(--focus-ring);
}

@media (max-width: 640px) {
  .admin-contact-preview {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }

  .admin-contact-preview__submit-input {
    width: 100%;
    align-self: stretch;
    min-height: 48px;
  }
}
</style>
