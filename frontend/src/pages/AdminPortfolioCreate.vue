<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Add gallery work</h1>
      <router-link to="/admin/gallery" class="admin-page-header__btn">← Gallery</router-link>
    </header>

    <div class="admin-float admin-float--padded">
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="gallery-label">Label *</label>
          <select id="gallery-label" v-model="form.label" required>
            <option disabled value="">Select a style</option>
            <option v-for="option in GALLERY_WORK_LABELS" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <div class="field">
          <span class="label-text">Photos *</span>
          <AdminProductImages
            v-model="imageRows"
            v-model:primary-index="primaryImageIndex"
            upload-folder="portfolio"
            :disabled="submitting"
            help-text=""
          />
        </div>

        <p v-if="submitError" class="error">{{ submitError }}</p>
        <div class="actions">
          <button type="submit" class="admin-panel__btn-primary" :disabled="submitting">
            {{ submitting ? 'Saving…' : 'Save' }}
          </button>
          <router-link to="/admin/gallery">Cancel</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createAdminPortfolio } from '../services/api.js';
import AdminProductImages, { buildProductImagesPayload } from '../components/admin/AdminProductImages.vue';
import { GALLERY_WORK_LABELS } from '../constants/galleryLabels.js';

const router = useRouter();

const form = reactive({
  label: ''
});

const imageRows = ref([]);
const primaryImageIndex = ref(0);
const submitError = ref('');
const submitting = ref(false);

function buildBody() {
  return {
    label: String(form.label).trim(),
    images: buildProductImagesPayload(imageRows.value, primaryImageIndex.value)
  };
}

function validate() {
  if (!String(form.label).trim()) {
    return 'Select a label.';
  }
  if (!buildProductImagesPayload(imageRows.value, primaryImageIndex.value).length) {
    return 'Upload at least one photo.';
  }
  return null;
}

async function onSubmit() {
  submitError.value = '';
  const err = validate();
  if (err) {
    submitError.value = err;
    return;
  }
  submitting.value = true;
  try {
    await createAdminPortfolio(buildBody());
    router.push('/admin/gallery');
  } catch (e) {
    submitError.value = e.message || 'Save failed';
  } finally {
    submitting.value = false;
  }
}
</script>
