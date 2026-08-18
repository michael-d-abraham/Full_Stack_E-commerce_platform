<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Edit wanna do</h1>
      <router-link to="/admin/listings" class="admin-page-header__btn">← Wanna Do's</router-link>
    </header>

    <p v-if="loadError" class="error admin-page-header__status">{{ loadError }}</p>
    <PageReveal v-else :ready="!loadingProduct">
      <template #skeleton>
        <div class="skeleton-stack admin-float admin-float--padded" aria-hidden="true">
          <Skeleton variant="title" />
          <Skeleton variant="line" />
          <Skeleton variant="line" />
          <Skeleton variant="card" height="10rem" />
          <Skeleton variant="button" width="8rem" />
        </div>
      </template>

      <div class="admin-float admin-float--padded">
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="title">Title *</label>
          <input id="title" v-model="form.title" type="text" autocomplete="off" />
          <p v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</p>
        </div>
        <div class="field">
          <label for="description">Description *</label>
          <textarea id="description" v-model="form.description" rows="6" />
          <p v-if="fieldErrors.description" class="field-error">{{ fieldErrors.description }}</p>
        </div>
        <div class="field">
          <label for="price">Price (USD) *</label>
          <input id="price" v-model.number="priceDollars" type="number" min="0" step="0.01" />
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
        <div class="field">
          <label>
            <input v-model="form.is_active" type="checkbox" />
            Active (visible on the Wanna Do's page)
          </label>
        </div>
        <p v-if="submitError" class="error">{{ submitError }}</p>
        <div class="actions">
          <button type="submit" class="admin-panel__btn-primary" :disabled="submitting">
            {{ submitting ? 'Saving…' : 'Save' }}
          </button>
          <router-link to="/admin/listings">Cancel</router-link>
        </div>
      </form>
    </div>
    </PageReveal>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import Skeleton from '../components/loading/Skeleton.vue';
import PageReveal from '../components/loading/PageReveal.vue';
import { useRoute, useRouter } from 'vue-router';
import { getAdminProductById, updateAdminProduct } from '../services/api.js';
import AdminProductImages, { buildProductImagesPayload } from '../components/admin/AdminProductImages.vue';
import { dollarsToCents } from '../utils/money.js';

const route = useRoute();
const router = useRouter();

const props = defineProps({
  id: {
    type: String,
    default: undefined
  }
});

const productId = computed(() => props.id || route.params.id);

const form = reactive({
  title: '',
  description: '',
  is_active: true
});

const priceDollars = ref(0);
const imageRows = ref([]);
const primaryImageIndex = ref(0);

const fieldErrors = reactive({
  title: '',
  description: ''
});

const loadingProduct = ref(false);
const loadError = ref('');
const submitError = ref('');
const submitting = ref(false);

function clearFieldErrors() {
  fieldErrors.title = '';
  fieldErrors.description = '';
}

function validate() {
  clearFieldErrors();
  let ok = true;
  if (!String(form.title).trim()) {
    fieldErrors.title = 'Title is required';
    ok = false;
  }
  if (!String(form.description).trim()) {
    fieldErrors.description = 'Description is required';
    ok = false;
  }
  if (!buildProductImagesPayload(imageRows.value, primaryImageIndex.value).length) {
    submitError.value = 'Upload a photo.';
    ok = false;
  }
  return ok;
}

function buildUpdateBody() {
  return {
    title: String(form.title).trim(),
    description: String(form.description).trim(),
    price_cents: dollarsToCents(priceDollars.value),
    is_active: !!form.is_active,
    currency: 'usd',
    images: buildProductImagesPayload(imageRows.value, primaryImageIndex.value)
  };
}

function populateFromProduct(p) {
  form.title = p.title ?? '';
  form.description = p.description ?? '';
  form.is_active = !!p.is_active;
  priceDollars.value = p.price_cents != null ? p.price_cents / 100 : 0;
  const imgs = Array.isArray(p.product_images) ? p.product_images.slice(0, 1) : [];
  imageRows.value = imgs.map((img) => ({
    id: img._id,
    url: img.image_url,
    image_provider_id: img.image_provider_id || ''
  }));
  primaryImageIndex.value = 0;
}

async function loadProduct() {
  if (!productId.value) {
    loadError.value = 'Missing id';
    return;
  }
  loadingProduct.value = true;
  loadError.value = '';
  try {
    const p = await getAdminProductById(productId.value);
    populateFromProduct(p);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loadingProduct.value = false;
  }
}

watch(
  () => ({ id: route.params.id, pid: props.id }),
  () => loadProduct(),
  { immediate: true }
);

async function onSubmit() {
  submitError.value = '';
  if (!validate()) return;
  if (!productId.value) {
    submitError.value = 'Missing id';
    return;
  }
  const cents = dollarsToCents(priceDollars.value);
  if (!Number.isInteger(cents)) {
    submitError.value = 'Enter a valid price';
    return;
  }
  submitting.value = true;
  try {
    await updateAdminProduct(productId.value, buildUpdateBody());
    router.push('/admin/listings');
  } catch (e) {
    submitError.value = e.message || 'Save failed';
  } finally {
    submitting.value = false;
  }
}
</script>
