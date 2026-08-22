<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">new wanna do</h1>
      <router-link to="/admin/listings" class="admin-page-header__btn">← wanna do's</router-link>
    </header>

    <div class="admin-float admin-float--padded">
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="wanna-do-label">tag *</label>
          <select id="wanna-do-label" v-model="form.label" required>
            <option disabled value="">select a style</option>
            <option v-for="option in GALLERY_WORK_LABELS" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <div class="field">
          <span class="label-text">photos *</span>
          <AdminProductImages
            v-model="imageRows"
            v-model:primary-index="primaryImageIndex"
            upload-folder="products"
            :disabled="submitting"
            help-text=""
          />
        </div>

        <p v-if="submitError" class="error">{{ submitError }}</p>
        <div class="actions">
          <button type="submit" class="admin-panel__btn-primary" :disabled="submitting">
            {{ submitting ? 'saving…' : 'save' }}
          </button>
          <router-link to="/admin/listings">cancel</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createAdminProduct } from '../services/api.js';
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
    return 'select a tag.';
  }
  if (!buildProductImagesPayload(imageRows.value, primaryImageIndex.value).length) {
    return 'upload at least one photo.';
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
    await createAdminProduct(buildBody());
    router.push('/admin/listings');
  } catch (e) {
    submitError.value = e.message || 'save failed';
  } finally {
    submitting.value = false;
  }
}
</script>
