<template>
  <div class="admin-social admin-social--embedded">
    <PageReveal :ready="!loading">
      <template #skeleton>
        <div class="skeleton-stack" aria-hidden="true">
          <Skeleton v-for="n in 4" :key="n" variant="table-row" />
        </div>
      </template>
      <p v-if="loadError" class="error admin-social__status">{{ loadError }}</p>

      <form v-else class="admin-social__form" @submit.prevent="onSubmit">
      <section class="admin-social__section" aria-labelledby="contact-section-heading">
        <h2 id="contact-section-heading" class="admin-social__section-title">Contact</h2>
        <p class="admin-social__section-hint">Form submissions from the Contact page are emailed to this address.</p>
        <div class="contact-email-field">
          <label for="contact-email" class="contact-email-field__label">Notification email</label>
          <input
            id="contact-email"
            v-model="contactEmail"
            type="email"
            class="contact-email-field__input"
            placeholder="you@example.com"
            autocomplete="email"
          />
          <p v-if="contactEmailError" class="field-error">{{ contactEmailError }}</p>
        </div>
      </section>

      <section class="admin-social__section" aria-labelledby="footer-section-heading">
        <h2 id="footer-section-heading" class="admin-social__section-title">Footer links</h2>
        <p class="admin-social__section-hint">
          Text and URLs shown in the site footer. Disabled links are hidden from visitors.
        </p>
        <div
          v-for="platform in platforms"
          :key="platform.id"
          class="platform-row"
        >
          <div class="platform-row__fields">
            <div class="platform-row__field">
              <label :for="'label-' + platform.id" class="platform-row__label">Link text</label>
              <input
                :id="'label-' + platform.id"
                v-model="form[platform.id].label"
                type="text"
                class="platform-row__label-input"
                :placeholder="platform.label"
                :aria-label="`${platform.label} link text`"
              />
            </div>
            <div class="platform-row__field">
              <label :for="'url-' + platform.id" class="platform-row__label">URL</label>
              <input
                :id="'url-' + platform.id"
                v-model="form[platform.id].url"
                type="url"
                class="platform-row__url"
                :placeholder="platform.placeholder"
                :aria-label="`${platform.label} URL`"
                autocomplete="url"
              />
            </div>
            <label class="platform-row__check" :for="'enabled-' + platform.id">
              <input
                :id="'enabled-' + platform.id"
                v-model="form[platform.id].enabled"
                type="checkbox"
              />
              <span>Include</span>
            </label>
          </div>
          <p v-if="fieldErrors[platform.id]" class="field-error platform-row__error">
            {{ fieldErrors[platform.id] }}
          </p>
        </div>
      </section>

      <footer class="admin-social__footer">
        <p v-if="submitError" class="error">{{ submitError }}</p>
        <p v-if="saved" class="admin-social__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary admin-social__save" :disabled="submitting">
          {{ submitting ? 'Saving…' : 'Save' }}
        </button>
      </footer>
    </form>
      </PageReveal>
</div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import Skeleton from '../components/loading/Skeleton.vue';
import PageReveal from '../components/loading/PageReveal.vue';

import { getAdminSocialLinks, updateAdminSocialLinks } from '../services/api.js';
import {
  PLATFORMS,
  DEFAULT_SOCIAL_LINKS,
  PLATFORM_LABELS
} from '@shared/socialLinksDefaults.js';

const PLATFORM_PLACEHOLDERS = {
  youtube: 'https://www.youtube.com/@channel',
  instagram: 'https://www.instagram.com/handle',
  tiktok: 'https://www.tiktok.com/@handle',
  facebook: 'https://www.facebook.com/page'
};

const platforms = PLATFORMS.map((id) => ({
  id,
  label: PLATFORM_LABELS[id],
  placeholder: PLATFORM_PLACEHOLDERS[id]
}));

const form = reactive(
  Object.fromEntries(
    PLATFORMS.map((id) => [
      id,
      {
        ...DEFAULT_SOCIAL_LINKS[id],
        label: DEFAULT_SOCIAL_LINKS[id].label || PLATFORM_LABELS[id]
      }
    ])
  )
);

const contactEmail = ref('');
const contactEmailError = ref('');
const loading = ref(true);
const loadError = ref('');
const submitError = ref('');
const saved = ref(false);
const submitting = ref(false);
const fieldErrors = reactive(
  Object.fromEntries(PLATFORMS.map((id) => [id, '']))
);

function applySettings(data) {
  contactEmail.value =
    data?.contact_email != null ? String(data.contact_email) : '';
  const links = data?.social_links || {};
  platforms.forEach(({ id }) => {
    const row = links[id] || {};
    form[id].url = row.url || form[id].url;
    form[id].enabled = row.enabled !== false;
    form[id].label =
      row.label != null && String(row.label).trim()
        ? String(row.label).trim()
        : DEFAULT_SOCIAL_LINKS[id].label || PLATFORM_LABELS[id];
  });
}

onMounted(async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await getAdminSocialLinks();
    applySettings(data);
  } catch (e) {
    loadError.value = e.message || 'Failed to load links';
  } finally {
    loading.value = false;
  }
});

function clearFieldErrors() {
  contactEmailError.value = '';
  platforms.forEach(({ id }) => {
    fieldErrors[id] = '';
  });
}

function buildSocialLinkPayload(id) {
  return {
    url: form[id].url,
    enabled: form[id].enabled,
    label: form[id].label
  };
}

async function onSubmit() {
  submitError.value = '';
  saved.value = false;
  clearFieldErrors();
  submitting.value = true;

  try {
    const data = await updateAdminSocialLinks({
      contact_email: contactEmail.value,
      social_links: Object.fromEntries(
        PLATFORMS.map((id) => [id, buildSocialLinkPayload(id)])
      )
    });
    applySettings(data);
    saved.value = true;
  } catch (e) {
    const errs = e.data?.errors;
    if (Array.isArray(errs)) {
      errs.forEach((msg) => {
        if (msg.includes('contact_email')) {
          contactEmailError.value = msg;
        }
        platforms.forEach(({ id }) => {
          if (msg.includes(id)) {
            fieldErrors[id] = msg;
          }
        });
      });
      if (!contactEmailError.value && !platforms.some(({ id }) => fieldErrors[id])) {
        submitError.value = errs.join(' ');
      }
    } else {
      submitError.value = e.message || 'Failed to save';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.admin-social {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.admin-social__status {
  margin: 0;
}

.admin-social__form {
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.admin-social__section {
  margin-bottom: var(--space-xl);
}

.admin-social__section-title {
  margin: 0 0 var(--space-xs);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.admin-social__section-hint {
  margin: 0 0 var(--space-md);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.contact-email-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  max-width: 24rem;
}

.contact-email-field__label {
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
}

.contact-email-field__input {
  width: 100%;
  min-height: 44px;
  padding: 0 0.65rem;
  box-sizing: border-box;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.platform-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.platform-row:last-of-type {
  border-bottom: none;
}

.platform-row__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;
}

.platform-row__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.platform-row__label {
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
}

.platform-row__label-input,
.platform-row__url {
  width: 100%;
  min-height: 44px;
  height: 44px;
  padding: 0 0.65rem;
  box-sizing: border-box;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.platform-row__check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  cursor: pointer;
  margin: 0;
}

.platform-row__check input {
  width: auto;
  margin: 0;
}

.platform-row__error {
  margin: 0;
}

.admin-social__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.admin-social__success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-social__save {
  min-height: 44px;
  margin-left: auto;
}

@media (min-width: 640px) {
  .platform-row__fields {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr) auto;
    align-items: end;
    gap: var(--space-md);
  }

  .platform-row__check {
    min-height: 44px;
    align-self: end;
    padding-bottom: 0.65rem;
  }
}

@media (max-width: 639px) {
  .admin-social__save {
    width: 100%;
    margin-left: 0;
  }
}
</style>
