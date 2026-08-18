<template>
  <div class="admin-home admin-home--embedded">
    <PageReveal :ready="!loading">
      <template #skeleton>
        <div class="skeleton-stack" aria-hidden="true">
          <Skeleton variant="card" height="14rem" />
          <Skeleton variant="button" width="10rem" />
        </div>
      </template>
      <p v-if="loadError" class="error admin-home__status">{{ loadError }}</p>

      <form v-else class="admin-home__form" @submit.prevent="onSave">
      <AdminHomePagePreview
        :form="form"
        :catalog-products="catalogProducts"
        :disabled="uploading || saving"
        @pick-image="openFilePicker"
        @remove-image="clearImage"
      />

      <footer class="admin-home__footer">
        <p v-if="actionError" class="error">{{ actionError }}</p>
        <p v-if="saved" class="admin-home__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary" :disabled="uploading || saving">
          {{ saving ? 'Saving…' : 'Save home page' }}
        </button>
      </footer>
    </form>

    <AdminPhotoUploadFlow
      ref="photoFlowRef"
      free-aspect
      show-orientation-tools
      :disabled="uploading || saving"
      @file="onPhotoFile"
      @cancel="onPhotoCancel"
    />
    </PageReveal>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import {
  getAdminHomePage,
  getAdminProducts,
  updateAdminHomePage,
  uploadAdminImage
} from '../services/api.js';
import AdminHomePagePreview from '../components/admin/AdminHomePagePreview.vue';
import AdminPhotoUploadFlow from '../components/admin/AdminPhotoUploadFlow.vue';
import PageReveal from '../components/loading/PageReveal.vue';
import Skeleton from '../components/loading/Skeleton.vue';
import { FEATURED_PRODUCT_SLOTS, emptyFeaturedProduct, resolveHeroImageUrls, resolveHeroImageFileIds } from '@shared/homePageDefaults.js';

function createEmptyForm() {
  return {
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    hero_image_urls: [],
    hero_image_file_id: '',
    hero_image_file_ids: [],
    hero_background_image_url: '',
    hero_background_image_file_id: '',
    featured_background_image_url: '',
    featured_background_image_file_id: '',
    featured_title: '',
    featured_products: Array.from({ length: FEATURED_PRODUCT_SLOTS }, emptyFeaturedProduct),
    about_title: '',
    hero_quote: '',
    about_header: '',
    about_text: '',
    about_image_url: '',
    about_image_file_id: '',
    about_background_image_url: '',
    about_background_image_file_id: ''
  };
}

const form = reactive(createEmptyForm());
const catalogProducts = ref([]);
const loading = ref(true);
const loadError = ref('');
const actionError = ref('');
const saved = ref(false);
const saving = ref(false);
const uploading = ref(false);
const uploadTarget = ref(null);
const photoFlowRef = ref(null);

function syncHeroFromUrls() {
  form.hero_image_url = form.hero_image_urls[0] || '';
  form.hero_image_file_id = form.hero_image_file_ids[0] || '';
}

function alignHeroFileIdsToUrls() {
  const targetLength = form.hero_image_urls.length;
  while (form.hero_image_file_ids.length < targetLength) {
    form.hero_image_file_ids.push('');
  }
  if (form.hero_image_file_ids.length > targetLength) {
    form.hero_image_file_ids.splice(targetLength);
  }
  syncHeroFromUrls();
}

function applySettings(data) {
  const next = createEmptyForm();
  if (data && typeof data === 'object') {
    next.hero_image_urls = resolveHeroImageUrls(data).slice(0, 1);
    next.hero_image_url = next.hero_image_urls[0] || '';
    next.hero_image_file_ids = resolveHeroImageFileIds(data).slice(0, next.hero_image_urls.length);
    next.hero_image_file_id = next.hero_image_file_ids[0] || '';
    next.hero_title = data.hero_title != null ? String(data.hero_title) : '';
    next.hero_subtitle = data.hero_subtitle != null ? String(data.hero_subtitle) : '';
    next.featured_title = data.featured_title != null ? String(data.featured_title) : '';
    next.about_title = data.about_title != null ? String(data.about_title) : '';
    next.hero_quote = data.hero_quote != null ? String(data.hero_quote) : '';
    next.about_header = data.about_header != null ? String(data.about_header) : '';
    next.about_text = data.about_text != null ? String(data.about_text) : '';
    next.about_image_url =
      data.about_image_url != null ? String(data.about_image_url).trim() : '';
    next.about_image_file_id =
      data.about_image_file_id != null ? String(data.about_image_file_id).trim() : '';
    next.hero_background_image_url =
      data.hero_background_image_url != null ? String(data.hero_background_image_url).trim() : '';
    next.hero_background_image_file_id =
      data.hero_background_image_file_id != null
        ? String(data.hero_background_image_file_id).trim()
        : '';
    next.featured_background_image_url =
      data.featured_background_image_url != null
        ? String(data.featured_background_image_url).trim()
        : '';
    next.featured_background_image_file_id =
      data.featured_background_image_file_id != null
        ? String(data.featured_background_image_file_id).trim()
        : '';
    next.about_background_image_url =
      data.about_background_image_url != null
        ? String(data.about_background_image_url).trim()
        : '';
    next.about_background_image_file_id =
      data.about_background_image_file_id != null
        ? String(data.about_background_image_file_id).trim()
        : '';

    const featured = Array.isArray(data.featured_products) ? data.featured_products : [];
    for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
      const row = featured[i] || {};
      next.featured_products[i] = {
        product_id: row.product_id != null ? String(row.product_id).trim() : ''
      };
    }
  }

  form.hero_image_url = next.hero_image_url;
  form.hero_image_urls.splice(0, form.hero_image_urls.length, ...next.hero_image_urls);
  form.hero_image_file_ids.splice(0, form.hero_image_file_ids.length, ...next.hero_image_file_ids);
  form.hero_image_file_id = next.hero_image_file_id;
  form.hero_title = next.hero_title;
  form.hero_subtitle = next.hero_subtitle;
  form.featured_title = next.featured_title;
  form.about_title = next.about_title;
  form.hero_quote = next.hero_quote;
  form.about_header = next.about_header;
  form.about_text = next.about_text;
  form.about_image_url = next.about_image_url;
  form.about_image_file_id = next.about_image_file_id;
  form.hero_background_image_url = next.hero_background_image_url;
  form.hero_background_image_file_id = next.hero_background_image_file_id;
  form.featured_background_image_url = next.featured_background_image_url;
  form.featured_background_image_file_id = next.featured_background_image_file_id;
  form.about_background_image_url = next.about_background_image_url;
  form.about_background_image_file_id = next.about_background_image_file_id;
  for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
    Object.assign(form.featured_products[i], next.featured_products[i]);
  }

  console.log('[AdminHomePage] form.hero_image_urls after applySettings', [...form.hero_image_urls]);
}

function payloadFromForm() {
  alignHeroFileIdsToUrls();
  const hero_image_urls = form.hero_image_urls
    .map((url) => String(url).trim())
    .filter(Boolean)
    .slice(0, 1);
  const hero_image_file_ids = form.hero_image_file_ids
    .slice(0, hero_image_urls.length)
    .map((id) => String(id || '').trim());
  return {
    hero_title: form.hero_title,
    hero_subtitle: form.hero_subtitle,
    hero_image_url: hero_image_urls[0] || '',
    hero_image_urls,
    hero_image_file_id: hero_image_file_ids[0] || '',
    hero_image_file_ids,
    featured_title: form.featured_title,
    featured_products: form.featured_products.map((row) => ({
      product_id: row.product_id
    })),
    about_title: form.about_title,
    hero_quote: form.hero_quote,
    about_header: form.about_header,
    about_text: form.about_text,
    about_image_url: form.about_image_url,
    about_image_file_id: form.about_image_file_id,
    hero_background_image_url: form.hero_background_image_url,
    hero_background_image_file_id: form.hero_background_image_file_id,
    featured_background_image_url: form.featured_background_image_url,
    featured_background_image_file_id: form.featured_background_image_file_id,
    about_background_image_url: form.about_background_image_url,
    about_background_image_file_id: form.about_background_image_file_id
  };
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const [homeData, products] = await Promise.all([
      getAdminHomePage(),
      getAdminProducts()
    ]);
    catalogProducts.value = Array.isArray(products)
      ? products.filter((p) => p && p.is_active !== false)
      : [];
    applySettings(homeData);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

async function persistSettings() {
  saving.value = true;
  actionError.value = '';
  saved.value = false;
  try {
    console.log('[AdminHomePage] form.hero_image_urls before save', [...form.hero_image_urls]);
    const payload = payloadFromForm();
    console.log('[AdminHomePage] PUT payload hero_image_urls', payload.hero_image_urls);
    const data = await updateAdminHomePage(payload);
    console.log('[AdminHomePage] PUT response hero_image_urls', data?.hero_image_urls);
    if (data?.hero_image_urls === undefined) {
      throw new Error('PUT response missing hero_image_urls');
    }
    applySettings(data);
    saved.value = true;
    window.setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch (e) {
    actionError.value = e.message || 'Save failed';
    throw e;
  } finally {
    saving.value = false;
  }
}

async function onSave() {
  await persistSettings();
}

function editorOptionsForTarget(target) {
  if (target?.type === 'hero') {
    return {
      editorTitle: 'Hero image',
      outputFileName: 'hero.jpg',
      outputMime: 'image/jpeg',
      preserveSourceFormat: false
    };
  }
  if (target?.type === 'about') {
    return {
      editorTitle: 'About image',
      outputFileName: 'about.jpg',
      outputMime: 'image/jpeg',
      preserveSourceFormat: false
    };
  }
  if (target?.type === 'hero-background') {
    return {
      editorTitle: 'Hero background texture',
      outputBaseName: 'hero-background',
      preserveSourceFormat: true
    };
  }
  if (target?.type === 'featured-background') {
    return {
      editorTitle: 'Featured section background texture',
      outputBaseName: 'featured-background',
      preserveSourceFormat: true
    };
  }
  if (target?.type === 'about-background') {
    return {
      editorTitle: 'About section background texture',
      outputBaseName: 'about-background',
      preserveSourceFormat: true
    };
  }
  return {};
}

function openFilePicker(target) {
  uploadTarget.value = target;
  actionError.value = '';
  photoFlowRef.value?.openPicker(editorOptionsForTarget(target));
}

function setImageUrl(target, url, fileId = '') {
  if (target.type === 'hero') {
    form.hero_image_urls.splice(0, form.hero_image_urls.length, url);
    form.hero_image_file_ids.splice(0, form.hero_image_file_ids.length, fileId || '');
    syncHeroFromUrls();
    return;
  }
  if (target.type === 'about') {
    form.about_image_url = url;
    form.about_image_file_id = fileId || '';
  }
  if (target.type === 'hero-background') {
    form.hero_background_image_url = url;
    form.hero_background_image_file_id = fileId || '';
  }
  if (target.type === 'featured-background') {
    form.featured_background_image_url = url;
    form.featured_background_image_file_id = fileId || '';
  }
  if (target.type === 'about-background') {
    form.about_background_image_url = url;
    form.about_background_image_file_id = fileId || '';
  }
}

function uploadFolderForTarget(target) {
  if (target?.type === 'hero') return 'site/hero';
  if (target?.type === 'hero-background') return 'site/hero-background';
  if (target?.type === 'featured-background') return 'site/featured-background';
  if (target?.type === 'about') return 'site/about';
  if (target?.type === 'about-background') return 'site/about-background';
  return undefined;
}

async function uploadFileForTarget(file) {
  const target = uploadTarget.value;
  if (!target || !file) return;

  uploading.value = true;
  actionError.value = '';
  try {
    const { image_url, file_id } = await uploadAdminImage(file, uploadFolderForTarget(target));
    console.log('[AdminHomePage] upload response image_url', image_url);
    setImageUrl(target, image_url, file_id);
    await persistSettings();
  } catch (e) {
    actionError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
    uploadTarget.value = null;
  }
}

async function onPhotoFile(file) {
  await uploadFileForTarget(file);
}

function onPhotoCancel() {
  uploadTarget.value = null;
}

async function clearImage(target) {
  if (target.type === 'hero') {
    form.hero_image_urls.splice(0, form.hero_image_urls.length);
    form.hero_image_file_ids.splice(0, form.hero_image_file_ids.length);
    syncHeroFromUrls();
    try {
      await persistSettings();
    } catch {
      /* actionError set in persistSettings */
    }
    return;
  }

  if (target.type === 'about') {
    form.about_image_url = '';
    form.about_image_file_id = '';
  }
  if (target.type === 'hero-background') {
    form.hero_background_image_url = '';
    form.hero_background_image_file_id = '';
  }
  if (target.type === 'featured-background') {
    form.featured_background_image_url = '';
    form.featured_background_image_file_id = '';
  }
  if (target.type === 'about-background') {
    form.about_background_image_url = '';
    form.about_background_image_file_id = '';
  }
  try {
    await persistSettings();
  } catch {
    /* actionError set in persistSettings */
  }
}

onMounted(load);
</script>

<style scoped>
.admin-home {
  width: 100%;
  max-width: none;
}

.admin-home--embedded {
  margin: 0;
}

.admin-home__status {
  color: var(--color-text-muted);
}

.admin-home__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-home__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.admin-home__success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
