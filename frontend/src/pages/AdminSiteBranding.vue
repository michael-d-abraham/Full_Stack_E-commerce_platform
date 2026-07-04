<template>
  <div class="admin-site-branding admin-site-branding--embedded">
    <p v-if="loading" class="admin-site-branding__status">Loading…</p>
    <p v-else-if="loadError" class="error admin-site-branding__status">{{ loadError }}</p>

    <form v-else class="admin-site-branding__form" @submit.prevent="onSubmit">
      <p class="admin-site-branding__hint">
        Shown in the site header, footer, and admin navigation. Choose text or upload a logo image.
        Leave the name blank to use {{ defaultSiteName }}.
      </p>

      <fieldset class="admin-site-branding__mode">
        <legend class="admin-site-branding__legend">Display as</legend>
        <label class="admin-site-branding__radio">
          <input v-model="brandDisplayMode" type="radio" name="brand-display-mode" value="text" />
          Text
        </label>
        <label class="admin-site-branding__radio">
          <input v-model="brandDisplayMode" type="radio" name="brand-display-mode" value="image" />
          Image
        </label>
      </fieldset>

      <div v-if="brandDisplayMode === 'text'" class="admin-site-branding__field">
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
      </div>

      <template v-else>
        <div class="admin-site-branding__field">
          <span class="admin-site-branding__label">Logo image</span>
          <AdminHomePreviewImageSlot
            class="admin-site-branding__logo-slot"
            :image-url="siteLogoUrl"
            :disabled="uploading || submitting"
            natural-display
            aria-label="Upload site logo"
            @pick="openFilePicker"
            @remove="clearLogo"
          />
          <p v-if="uploading" class="admin-site-branding__uploading">Uploading…</p>
        </div>

        <div class="admin-site-branding__field">
          <label for="site-name-image" class="admin-site-branding__label">
            Site name
            <span class="admin-site-branding__label-note">(accessibility &amp; copyright)</span>
          </label>
          <input
            id="site-name-image"
            v-model="siteNameInput"
            type="text"
            class="admin-site-branding__input"
            :placeholder="defaultSiteName"
            maxlength="80"
            autocomplete="organization"
          />
        </div>
      </template>

      <p v-if="fieldError" class="field-error">{{ fieldError }}</p>

      <footer class="admin-site-branding__footer">
        <p v-if="submitError" class="error">{{ submitError }}</p>
        <p v-if="saved" class="admin-site-branding__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary" :disabled="submitting || uploading">
          {{ submitting ? 'Saving…' : 'Save' }}
        </button>
      </footer>
    </form>

    <AdminPhotoUploadFlow
      ref="photoFlowRef"
      editor-title="Site logo"
      free-aspect
      show-orientation-tools
      output-file-name="site-logo.jpg"
      :disabled="uploading || submitting"
      @file="onPhotoFile"
      @cancel="onPhotoCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminSiteBranding, updateAdminSiteBranding, uploadAdminImage } from '../services/api.js';
import { DEFAULT_SITE_NAME } from '@shared/siteBrandDefaults.js';
import { setSiteBrandFromStored } from '../composables/useSiteBrand.js';
import AdminHomePreviewImageSlot from '../components/admin/AdminHomePreviewImageSlot.vue';
import AdminPhotoUploadFlow from '../components/admin/AdminPhotoUploadFlow.vue';

const defaultSiteName = DEFAULT_SITE_NAME;
const siteNameInput = ref('');
const brandDisplayMode = ref('text');
const siteLogoUrl = ref('');
const fieldError = ref('');
const loading = ref(true);
const loadError = ref('');
const submitError = ref('');
const saved = ref(false);
const submitting = ref(false);
const uploading = ref(false);
const photoFlowRef = ref(null);

function applySettings(data) {
  siteNameInput.value = data?.site_name != null ? String(data.site_name) : '';
  brandDisplayMode.value = data?.brand_display_mode === 'image' ? 'image' : 'text';
  siteLogoUrl.value = data?.site_logo_url != null ? String(data.site_logo_url).trim() : '';
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await getAdminSiteBranding();
    applySettings(data);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

function openFilePicker() {
  submitError.value = '';
  fieldError.value = '';
  photoFlowRef.value?.openPicker();
}

async function onPhotoFile(file) {
  if (!file) {
    return;
  }

  uploading.value = true;
  submitError.value = '';
  fieldError.value = '';
  try {
    const { image_url } = await uploadAdminImage(file);
    siteLogoUrl.value = image_url;
  } catch (e) {
    submitError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

function onPhotoCancel() {
  /* no-op */
}

function clearLogo() {
  siteLogoUrl.value = '';
}

async function onSubmit() {
  submitting.value = true;
  submitError.value = '';
  fieldError.value = '';
  saved.value = false;

  try {
    const data = await updateAdminSiteBranding({
      site_name: siteNameInput.value,
      brand_display_mode: brandDisplayMode.value,
      site_logo_url: siteLogoUrl.value
    });
    applySettings(data);
    setSiteBrandFromStored(data);
    saved.value = true;
    window.setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch (e) {
    const message = e.message || 'Save failed';
    if (
      message.toLowerCase().includes('site_name') ||
      message.toLowerCase().includes('site_logo_url') ||
      message.toLowerCase().includes('brand_display_mode')
    ) {
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

.admin-site-branding__mode {
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md) var(--space-xl);
}

.admin-site-branding__legend {
  width: 100%;
  margin: 0 0 var(--space-xs);
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.admin-site-branding__radio {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  cursor: pointer;
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

.admin-site-branding__label-note {
  font-weight: 400;
  color: var(--color-text-muted);
}

.admin-site-branding__input {
  width: 100%;
}

.admin-site-branding__logo-slot {
  max-width: 16rem;
}

.admin-site-branding__logo-slot :deep(.admin-home-img-slot__hit) {
  min-height: 5rem;
}

.admin-site-branding__uploading {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
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
