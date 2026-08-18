<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Edit gallery work</h1>
      <router-link to="/admin/gallery" class="admin-page-header__btn">← Gallery</router-link>
    </header>

    <p v-if="loadError" class="error admin-page-header__status">{{ loadError }}</p>
    <PageReveal v-else :ready="!loadingItem">
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
          <label for="title">Title</label>
          <input id="title" v-model="form.title" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="description">Description</label>
          <textarea id="description" v-model="form.description" rows="5" />
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
        <div class="field">
          <label>
            <input v-model="form.is_active" type="checkbox" />
            Active (visible in the gallery)
          </label>
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
    </PageReveal>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import Skeleton from '../components/loading/Skeleton.vue';
import PageReveal from '../components/loading/PageReveal.vue';
import { useRoute, useRouter } from 'vue-router';
import { getAdminPortfolioById, updateAdminPortfolio } from '../services/api.js';
import AdminProductImages, { buildProductImagesPayload } from '../components/admin/AdminProductImages.vue';

const route = useRoute();
const router = useRouter();

const props = defineProps({
  id: { type: String, default: undefined }
});

const itemId = computed(() => props.id || route.params.id);

const form = reactive({
  title: '',
  description: '',
  is_active: true
});

const imageRows = ref([]);
const primaryImageIndex = ref(0);
const loadingItem = ref(false);
const loadError = ref('');
const submitError = ref('');
const submitting = ref(false);

function populateFromItem(item) {
  form.title = item.title ?? '';
  form.description = item.description ?? '';
  form.is_active = !!item.is_active;
  const imgs = Array.isArray(item.portfolio_images) ? item.portfolio_images : [];
  imageRows.value = imgs.map((img) => ({
    id: img._id,
    url: img.image_url,
    image_provider_id: img.image_provider_id || ''
  }));
  const primaryIdx = imgs.findIndex((img) => img.is_primary);
  primaryImageIndex.value = primaryIdx >= 0 ? primaryIdx : 0;
}

async function loadItem() {
  if (!itemId.value) {
    loadError.value = 'Missing id';
    return;
  }
  loadingItem.value = true;
  loadError.value = '';
  try {
    const item = await getAdminPortfolioById(itemId.value);
    populateFromItem(item);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loadingItem.value = false;
  }
}

watch(
  () => ({ id: route.params.id, pid: props.id }),
  () => loadItem(),
  { immediate: true }
);

async function onSubmit() {
  submitError.value = '';
  const images = buildProductImagesPayload(imageRows.value, primaryImageIndex.value);
  if (!images.length) {
    submitError.value = 'Upload at least one photo.';
    return;
  }
  submitting.value = true;
  try {
    await updateAdminPortfolio(itemId.value, {
      title: String(form.title).trim(),
      description: String(form.description).trim(),
      is_active: !!form.is_active,
      images
    });
    router.push('/admin/gallery');
  } catch (e) {
    submitError.value = e.message || 'Save failed';
  } finally {
    submitting.value = false;
  }
}
</script>
