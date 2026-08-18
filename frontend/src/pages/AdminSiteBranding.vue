<template>
  <div class="admin-site-branding admin-site-branding--embedded">
    <PageReveal :ready="!loading">
      <template #skeleton>
        <div class="skeleton-stack" aria-hidden="true">
          <Skeleton variant="line" width="80%" />
          <Skeleton variant="button" width="8rem" />
          <Skeleton variant="card" height="6rem" />
        </div>
      </template>
      <p v-if="loadError" class="error admin-site-branding__status">{{ loadError }}</p>

      <form v-else class="admin-site-branding__form" @submit.prevent="onSubmit">
      <p class="admin-site-branding__hint">
        Shown in the site header, footer, and admin navigation. Choose text or upload a logo image.
        Leave the name blank to use {{ defaultSiteName }}.
      </p>

      <fieldset class="admin-site-branding__mode">
        <legend class="admin-site-branding__label">Display as</legend>
        <label class="admin-site-branding__mode-option">
          <input v-model="siteNameMode" type="radio" value="text" />
          Text
        </label>
        <label class="admin-site-branding__mode-option">
          <input v-model="siteNameMode" type="radio" value="image" />
          Image
        </label>
      </fieldset>

      <div v-if="siteNameMode === 'text'" class="admin-site-branding__field">
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
        <div class="admin-site-branding__logo-panel">
          <div class="admin-site-branding__logo-preview">
            <img
              v-if="siteNameLogoUrl"
              :src="siteNameLogoUrl"
              :alt="resolvedSiteName"
              class="admin-site-branding__logo-image"
            />
            <p v-else class="admin-site-branding__logo-empty">No logo uploaded yet.</p>
          </div>
          <div class="admin-site-branding__logo-actions">
            <button
              type="button"
              class="btn-outline"
              :disabled="uploading || submitting"
              @click="openLogoPicker"
            >
              {{ siteNameLogoUrl ? 'Replace logo' : 'Upload logo' }}
            </button>
            <button
              v-if="siteNameLogoUrl"
              type="button"
              class="btn-outline"
              :disabled="uploading || submitting"
              @click="clearLogo"
            >
              Remove
            </button>
          </div>
        </div>

        <div class="admin-site-branding__field">
          <label for="site-name-alt" class="admin-site-branding__label">
            Site name for accessibility
          </label>
          <input
            id="site-name-alt"
            v-model="siteNameInput"
            type="text"
            class="admin-site-branding__input"
            :placeholder="defaultSiteName"
            maxlength="80"
            autocomplete="organization"
          />
          <p class="admin-site-branding__field-hint">
            Used for screen readers and the copyright line when a logo is shown.
          </p>
        </div>
      </template>

      <p v-if="fieldError" class="field-error">{{ fieldError }}</p>

      <footer class="admin-site-branding__footer">
        <UploadProgress v-if="uploading" />
        <p v-if="submitError" class="error">{{ submitError }}</p>
        <p v-if="saved" class="admin-site-branding__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary" :disabled="uploading || submitting">
          {{ submitting ? 'Saving…' : 'Save' }}
        </button>
      </footer>
    </form>

    <AdminPhotoUploadFlow
      ref="photoFlowRef"
      editor-title="Site logo"
      free-aspect
      show-orientation-tools
      output-base-name="site-logo"
      preserve-source-format
      :disabled="uploading || submitting"
      @file="onLogoFile"
      @cancel="onPhotoCancel"
    />
    </PageReveal>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { getAdminSiteBranding, updateAdminSiteBranding, uploadAdminImage } from '../services/api.js';
import { DEFAULT_SITE_NAME, resolveSiteName } from '@shared/siteBrandDefaults.js';
import { invalidateSiteBrand, setBrandingFromStored } from '../composables/useSiteBrand.js';
import AdminPhotoUploadFlow from '../components/admin/AdminPhotoUploadFlow.vue';
import PageReveal from '../components/loading/PageReveal.vue';
import Skeleton from '../components/loading/Skeleton.vue';
import UploadProgress from '../components/loading/UploadProgress.vue';

const defaultSiteName = DEFAULT_SITE_NAME;
const siteNameInput = ref('');
const siteNameMode = ref('text');
const siteNameLogoUrl = ref('');
const siteNameLogoFileId = ref('');
const fieldError = ref('');
const loading = ref(true);
const loadError = ref('');
const submitError = ref('');
const saved = ref(false);
const submitting = ref(false);
const uploading = ref(false);
const photoFlowRef = ref(null);

const resolvedSiteName = computed(() => resolveSiteName(siteNameInput.value));

function applySettings(data) {
  siteNameInput.value = data?.site_name != null ? String(data.site_name) : '';
  siteNameMode.value = data?.site_name_mode === 'image' ? 'image' : 'text';
  siteNameLogoUrl.value =
    data?.site_name_logo_url != null ? String(data.site_name_logo_url).trim() : '';
  siteNameLogoFileId.value =
    data?.site_name_logo_file_id != null ? String(data.site_name_logo_file_id).trim() : '';
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

function brandingPayload() {
  return {
    site_name: siteNameInput.value,
    site_name_mode: siteNameMode.value,
    site_name_logo_url: siteNameLogoUrl.value,
    site_name_logo_file_id: siteNameLogoFileId.value
  };
}

async function persistBranding() {
  const data = await updateAdminSiteBranding(brandingPayload());
  applySettings(data);
  invalidateSiteBrand();
  setBrandingFromStored(data);
}

async function onSubmit() {
  submitting.value = true;
  submitError.value = '';
  fieldError.value = '';
  saved.value = false;

  try {
    await persistBranding();
    saved.value = true;
    window.setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch (e) {
    const message = e.message || 'Save failed';
    if (
      message.toLowerCase().includes('site_name') ||
      message.toLowerCase().includes('logo')
    ) {
      fieldError.value = message;
    } else {
      submitError.value = message;
    }
  } finally {
    submitting.value = false;
  }
}

function openLogoPicker() {
  fieldError.value = '';
  photoFlowRef.value?.openPicker({
    editorTitle: 'Site logo',
    outputBaseName: 'site-logo',
    preserveSourceFormat: true
  });
}

async function onLogoFile(file) {
  if (!file) return;

  uploading.value = true;
  submitError.value = '';
  fieldError.value = '';

  try {
    const { image_url, file_id } = await uploadAdminImage(file, 'site/logo');
    siteNameLogoUrl.value = image_url;
    siteNameLogoFileId.value = file_id || '';
    siteNameMode.value = 'image';
    await persistBranding();
    saved.value = true;
    window.setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch (e) {
    submitError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

function onPhotoCancel() {}

async function clearLogo() {
  siteNameLogoUrl.value = '';
  siteNameLogoFileId.value = '';
  fieldError.value = '';
  try {
    await persistBranding();
  } catch (e) {
    submitError.value = e.message || 'Failed to remove logo';
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
  border: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.admin-site-branding__mode-option {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 500;
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

.admin-site-branding__field-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.admin-site-branding__input {
  width: 100%;
}

.admin-site-branding__logo-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 28rem;
}

.admin-site-branding__logo-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 6rem;
  padding: var(--space-md);
  border: 1px dashed var(--color-border);
  background: var(--color-surface);
}

.admin-site-branding__logo-image {
  display: block;
  max-width: 100%;
  max-height: 5rem;
  object-fit: contain;
}

.admin-site-branding__logo-empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-site-branding__logo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.admin-site-branding__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.admin-site-branding__uploading,
.admin-site-branding__success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
