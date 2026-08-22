<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">edit wanna do</h1>
      <router-link to="/admin/listings" class="admin-page-header__btn">← wanna do's</router-link>
    </header>

    <p v-if="loadError" class="error admin-page-header__status">{{ loadError }}</p>
    <PageReveal v-else :ready="!loadingProduct">
      <template #skeleton>
        <div class="skeleton-stack admin-float admin-float--padded" aria-hidden="true">
          <Skeleton variant="title" />
          <Skeleton variant="line" />
          <Skeleton variant="card" height="10rem" />
        </div>
      </template>

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
        <div class="field">
          <label>
            <input v-model="form.is_active" type="checkbox" />
            active (visible with wanna do's)
          </label>
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
import { GALLERY_WORK_LABELS } from '../constants/galleryLabels.js';

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
  label: '',
  is_active: true
});

const imageRows = ref([]);
const primaryImageIndex = ref(0);
const loadingProduct = ref(false);
const loadError = ref('');
const submitError = ref('');
const submitting = ref(false);

function populateFromProduct(p) {
  const nextLabel = String(p.label || p.title || '').trim();
  form.label = GALLERY_WORK_LABELS.includes(nextLabel) ? nextLabel : '';
  form.is_active = !!p.is_active;
  const imgs = Array.isArray(p.product_images) ? p.product_images : [];
  imageRows.value = imgs.map((img) => ({
    id: img._id,
    url: img.image_url,
    image_provider_id: img.image_provider_id || ''
  }));
  const primaryIdx = imgs.findIndex((img) => img.is_primary);
  primaryImageIndex.value = primaryIdx >= 0 ? primaryIdx : 0;
}

async function loadProduct() {
  if (!productId.value) {
    loadError.value = 'missing id';
    return;
  }
  loadingProduct.value = true;
  loadError.value = '';
  try {
    const p = await getAdminProductById(productId.value);
    populateFromProduct(p);
  } catch (e) {
    loadError.value = e.message || 'failed to load';
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
  const images = buildProductImagesPayload(imageRows.value, primaryImageIndex.value);
  if (!String(form.label).trim()) {
    submitError.value = 'select a tag.';
    return;
  }
  if (!images.length) {
    submitError.value = 'upload at least one photo.';
    return;
  }
  if (!productId.value) {
    submitError.value = 'missing id';
    return;
  }
  submitting.value = true;
  try {
    await updateAdminProduct(productId.value, {
      label: String(form.label).trim(),
      is_active: !!form.is_active,
      images
    });
    router.push('/admin/listings');
  } catch (e) {
    submitError.value = e.message || 'save failed';
  } finally {
    submitting.value = false;
  }
}
</script>
