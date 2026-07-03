<template>
  <div class="admin-site-branding admin-site-branding--embedded">
    <p v-if="loading" class="admin-site-branding__status">Loading…</p>
    <p v-else-if="loadError" class="error admin-site-branding__status">{{ loadError }}</p>

    <form v-else class="admin-site-branding__form" @submit.prevent="onSubmit">
      <p class="admin-site-branding__hint">
        Shown in the site header, footer, and admin navigation. Leave blank to use
        {{ defaultSiteName }}.
      </p>
      <div class="admin-site-branding__field">
        <label for="site-name" class="admin-site-branding__label">Site name</label>
        <input
          id="site-name"
          v-model="siteNameInput"
          type="text"
          class="admin-site-branding__input"
          :placeholder="defaultSiteName"
          maxlength="80"
          autocomplete="organization"
        />
        <p v-if="fieldError" class="field-error">{{ fieldError }}</p>
      </div>

      <footer class="admin-site-branding__footer">
        <p v-if="submitError" class="error">{{ submitError }}</p>
        <p v-if="saved" class="admin-site-branding__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? 'Saving…' : 'Save' }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminSiteBranding, updateAdminSiteBranding } from '../services/api.js';
import { DEFAULT_SITE_NAME } from '@shared/siteBrandDefaults.js';
import { setSiteNameFromStored } from '../composables/useSiteBrand.js';

const defaultSiteName = DEFAULT_SITE_NAME;
const siteNameInput = ref('');
const fieldError = ref('');
const loading = ref(true);
const loadError = ref('');
const submitError = ref('');
const saved = ref(false);
const submitting = ref(false);

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await getAdminSiteBranding();
    siteNameInput.value = data?.site_name != null ? String(data.site_name) : '';
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  submitting.value = true;
  submitError.value = '';
  fieldError.value = '';
  saved.value = false;

  try {
    const data = await updateAdminSiteBranding({ site_name: siteNameInput.value });
    siteNameInput.value = data?.site_name != null ? String(data.site_name) : '';
    setSiteNameFromStored(data?.site_name);
    saved.value = true;
    window.setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch (e) {
    const message = e.message || 'Save failed';
    if (message.toLowerCase().includes('site_name')) {
      fieldError.value = message;
    } else {
      submitError.value = message;
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.admin-site-branding--embedded {
  margin: 0;
}

.admin-site-branding__status {
  color: var(--color-text-muted);
}

.admin-site-branding__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-site-branding__hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.admin-site-branding__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-width: 28rem;
}

.admin-site-branding__label {
  font-size: 0.875rem;
  font-weight: 600;
}

.admin-site-branding__input {
  width: 100%;
}

.admin-site-branding__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.admin-site-branding__success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
