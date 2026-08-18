<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">New wanna do</h1>
      <router-link to="/admin/listings" class="admin-page-header__btn">← Wanna Do's</router-link>
    </header>

    <div class="admin-float admin-float--padded">
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="title">Title *</label>
          <input id="title" v-model="form.title" type="text" autocomplete="off" placeholder="e.g. Floral sternum piece" />
          <p class="help">Shown on the Wanna Do's page when clients browse available designs.</p>
        </div>

        <div class="field">
          <label for="desc">Description *</label>
          <textarea id="desc" v-model="form.description" rows="5" placeholder="Describe the design, placement, or notes for clients" />
        </div>

        <div class="field">
          <label for="price">Price (USD) *</label>
          <input id="price" v-model.number="priceDollars" type="number" min="0" step="0.01" />
          <p class="help">For display only — online checkout is not enabled yet.</p>
        </div>

        <div class="field">
          <span class="label-text">Photo *</span>
          <AdminProductImages
            v-model="imageRows"
            v-model:primary-index="primaryImageIndex"
            upload-folder="products"
            :max-images="1"
            :offer-photo-editor="true"
            help-text="Upload one photo of the design."
            add-label="Upload photo"
            :disabled="submitting"
          />
        </div>

        <p v-if="submitError" class="error">{{ submitError }}</p>
        <div class="actions">
          <button type="submit" class="admin-panel__btn-primary" :disabled="submitting">
            {{ submitting ? 'Saving…' : 'Save wanna do' }}
          </button>
          <router-link to="/admin/listings">Cancel</router-link>
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
import { dollarsToCents } from '../utils/money.js';

const router = useRouter();

const form = reactive({
  title: '',
  description: ''
});

const priceDollars = ref(0);
const imageRows = ref([]);
const primaryImageIndex = ref(0);

function buildImages() {
  return buildProductImagesPayload(imageRows.value, primaryImageIndex.value);
}

function buildBody() {
  return {
    title: String(form.title).trim(),
    description: String(form.description).trim(),
    price_cents: dollarsToCents(priceDollars.value),
    currency: 'usd',
    images: buildImages()
  };
}

function validate() {
  if (!String(form.title).trim()) return 'Enter a title.';
  if (!String(form.description).trim()) return 'Enter a description.';
  const cents = dollarsToCents(priceDollars.value);
  if (!Number.isInteger(cents)) return 'Enter a valid price.';
  if (!buildImages().length) return 'Upload a photo.';
  return null;
}

const submitError = ref('');
const submitting = ref(false);

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
    submitError.value = e.message || 'Save failed';
  } finally {
    submitting.value = false;
  }
}
</script>
