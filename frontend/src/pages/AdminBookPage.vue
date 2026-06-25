<template>
  <div class="admin-book admin-book--embedded">
    <p v-if="loading" class="admin-book__status">Loading…</p>
    <p v-else-if="loadError" class="error admin-book__status">{{ loadError }}</p>

    <form v-else class="admin-book__form" @submit.prevent="onSave">
      <label class="admin-book__nav-toggle">
        <input v-model="form.show_in_nav" type="checkbox" :disabled="saving" />
        <span>Show Book tab in navigation</span>
      </label>

      <label class="admin-book__field">
        <span class="admin-book__label">Booking URL</span>
        <input
          v-model.trim="form.booking_url"
          type="url"
          class="admin-book__input"
          required
          autocomplete="off"
          @input="clearFieldError('booking_url')"
        />
        <span v-if="fieldErrors.booking_url" class="error admin-book__field-error">{{ fieldErrors.booking_url }}</span>
      </label>

      <label class="admin-book__field">
        <span class="admin-book__label">Page title</span>
        <input
          v-model.trim="form.page_title"
          type="text"
          class="admin-book__input"
          required
          autocomplete="off"
          @input="clearFieldError('page_title')"
        />
        <span v-if="fieldErrors.page_title" class="error admin-book__field-error">{{ fieldErrors.page_title }}</span>
      </label>

      <label class="admin-book__field">
        <span class="admin-book__label">Body text</span>
        <textarea
          v-model.trim="form.body_text"
          class="admin-book__textarea"
          rows="3"
          required
          @input="clearFieldError('body_text')"
        ></textarea>
        <span v-if="fieldErrors.body_text" class="error admin-book__field-error">{{ fieldErrors.body_text }}</span>
      </label>

      <label class="admin-book__field">
        <span class="admin-book__label">Button label</span>
        <input
          v-model.trim="form.button_label"
          type="text"
          class="admin-book__input"
          required
          autocomplete="off"
          @input="clearFieldError('button_label')"
        />
        <span v-if="fieldErrors.button_label" class="error admin-book__field-error">{{ fieldErrors.button_label }}</span>
      </label>

      <footer class="admin-book__footer">
        <p v-if="actionError" class="error">{{ actionError }}</p>
        <p v-if="saved" class="admin-book__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save book page' }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import {
  getAdminBookPage,
  updateAdminBookPage
} from '../services/api.js';
import { applyBookPageDefaults, DEFAULT_BOOK_PAGE } from '../constants/bookPageDefaults.js';
import { invalidateStorefrontNav } from '../composables/useStorefrontNav.js';

function createEmptyForm() {
  return {
    show_in_nav: DEFAULT_BOOK_PAGE.show_in_nav,
    booking_url: DEFAULT_BOOK_PAGE.booking_url,
    page_title: DEFAULT_BOOK_PAGE.page_title,
    body_text: DEFAULT_BOOK_PAGE.body_text,
    button_label: DEFAULT_BOOK_PAGE.button_label
  };
}

const form = reactive(createEmptyForm());
const loading = ref(true);
const loadError = ref('');
const actionError = ref('');
const saved = ref(false);
const saving = ref(false);
const fieldErrors = reactive({});

function applySettings(data, savedNavPreference) {
  const next = applyBookPageDefaults(data);
  if (typeof data?.show_in_nav === 'boolean') {
    form.show_in_nav = data.show_in_nav;
  } else if (typeof savedNavPreference === 'boolean') {
    form.show_in_nav = savedNavPreference;
  } else {
    form.show_in_nav = next.show_in_nav !== false;
  }
  form.booking_url = next.booking_url || DEFAULT_BOOK_PAGE.booking_url;
  form.page_title = next.page_title || DEFAULT_BOOK_PAGE.page_title;
  form.body_text = next.body_text || DEFAULT_BOOK_PAGE.body_text;
  form.button_label = next.button_label || DEFAULT_BOOK_PAGE.button_label;
}

function payloadFromForm() {
  return {
    show_in_nav: form.show_in_nav,
    booking_url: form.booking_url,
    page_title: form.page_title,
    body_text: form.body_text,
    button_label: form.button_label
  };
}

function validateClient() {
  const fields = ['booking_url', 'page_title', 'body_text', 'button_label'];
  for (const field of fields) {
    const value = form[field];
    if (!value || !String(value).trim()) {
      fieldErrors[field] = `${field.replace('_', ' ')} is required`;
    }
  }
  return Object.keys(fieldErrors).length === 0;
}

function clearFieldError(field) {
  if (fieldErrors[field]) {
    fieldErrors[field] = '';
  }
}

function setFieldErrorsFromServer(errors) {
  const messages = Array.isArray(errors) ? errors : [];
  // Clear existing client-side errors first
  for (const key of Object.keys(fieldErrors)) {
    fieldErrors[key] = '';
  }
  // Map server errors back to fields when possible
  for (const msg of messages) {
    const lower = String(msg).toLowerCase();
    for (const field of ['booking_url', 'page_title', 'body_text', 'button_label']) {
      if (lower.startsWith(field)) {
        fieldErrors[field] = msg;
        break;
      }
    }
  }
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await getAdminBookPage();
    applySettings(data);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

async function persistSettings() {
  saving.value = true;
  actionError.value = '';
  saved.value = false;
  try {
    const payload = payloadFromForm();
    const data = await updateAdminBookPage(payload);
    applySettings(data, payload.show_in_nav);
    invalidateStorefrontNav();
    saved.value = true;
    window.setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch (e) {
    const serverErrors = e?.data?.errors;
    if (Array.isArray(serverErrors)) {
      setFieldErrorsFromServer(serverErrors);
    }
    actionError.value = e.message || 'Save failed';
    throw e;
  } finally {
    saving.value = false;
  }
}

async function onSave() {
  // Reset field errors and run client-side validation
  for (const key of Object.keys(fieldErrors)) {
    fieldErrors[key] = '';
  }
  if (!validateClient()) {
    actionError.value = 'Please fill in all fields.';
    return;
  }
  await persistSettings();
}

onMounted(load);
</script>

<style scoped>
.admin-book {
  width: 100%;
  max-width: none;
}

.admin-book--embedded {
  margin: 0;
}

.admin-book__status {
  color: var(--color-text-muted);
}

.admin-book__nav-toggle {
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

.admin-book__nav-toggle input {
  width: auto;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.admin-book__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-book__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.admin-book__label {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.admin-book__input,
.admin-book__textarea {
  font-family: inherit;
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0;
  padding: 0.625rem 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.admin-book__textarea {
  resize: vertical;
  min-height: 4.5rem;
  line-height: 1.5;
}

.admin-book__input:focus,
.admin-book__textarea:focus {
  outline: none;
  border-color: var(--color-text);
}

.admin-book__field-error {
  font-size: 0.8125rem;
  margin: 0;
}

.admin-book__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.admin-book__success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>