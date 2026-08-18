<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Add gallery work</h1>
      <router-link to="/admin/gallery" class="admin-page-header__btn">← Gallery</router-link>
    </header>

    <div class="admin-float admin-float--padded">
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="title">Title</label>
          <input id="title" v-model="form.title" type="text" autocomplete="off" placeholder="Optional — e.g. Floral forearm" />
        </div>

        <div class="field">
          <label for="desc">Description</label>
          <textarea id="desc" v-model="form.description" rows="4" placeholder="Optional notes about the piece" />
        </div>

        <div class="field">
          <span class="label-text">Photos *</span>
          <AdminProductImages
            v-model="imageRows"
            v-model:primary-index="primaryImageIndex"
            upload-folder="portfolio"
            help-text="Upload one or more photos of the finished tattoo."
            :disabled="submitting"
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

const router = useRouter();

const form = reactive({
  title: '',
  description: ''
});

const imageRows = ref([]);
const primaryImageIndex = ref(0);
const submitError = ref('');
const submitting = ref(false);

function buildBody() {
  return {
    title: String(form.title).trim(),
    description: String(form.description).trim(),
    images: buildProductImagesPayload(imageRows.value, primaryImageIndex.value)
  };
}

function validate() {
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
