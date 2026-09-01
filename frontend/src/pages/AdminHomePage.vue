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
    <input
      ref="videoInputRef"
      type="file"
      class="admin-home__video-input"
      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
      tabindex="-1"
      aria-hidden="true"
      @change="onVideoPicked"
    />
    </PageReveal>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import {
  getAdminHomePage,
  updateAdminHomePage,
  uploadAdminImage,
  uploadAdminVideo
} from '../services/api.js';
import AdminHomePagePreview from '../components/admin/AdminHomePagePreview.vue';
import AdminPhotoUploadFlow from '../components/admin/AdminPhotoUploadFlow.vue';
import PageReveal from '../components/loading/PageReveal.vue';
import Skeleton from '../components/loading/Skeleton.vue';
import { FEATURED_PRODUCT_SLOTS, emptyFeaturedProduct, resolveHeroImageUrls, resolveHeroImageFileIds, resolveHeroMediaTypes } from '@shared/homePageDefaults.js';
import { HERO_SLIDESHOW_MAX } from '../constants/heroSlideshow.js';

function createEmptyForm() {
  return {
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    hero_image_urls: [],
    hero_image_file_id: '',
    hero_image_file_ids: [],
    hero_media_types: [],
    hero_lines_image_url: '',
    hero_lines_image_file_id: '',
    hero_background_image_url: '',
    hero_background_image_file_id: '',
    featured_title: '',
    featured_products: Array.from({ length: FEATURED_PRODUCT_SLOTS }, emptyFeaturedProduct),
    about_title: '',
    hero_quote: '',
    about_header: '',
    about_text: '',
    about_image_url: '',
    about_image_file_id: '',
    about_me_left_image_url: '',
    about_me_left_image_file_id: '',
    about_me_right_image_url: '',
    about_me_right_image_file_id: '',
    about_background_image_url: '',
    about_background_image_file_id: ''
  };
}

const form = reactive(createEmptyForm());
const loading = ref(true);
const loadError = ref('');
const actionError = ref('');
const saved = ref(false);
const saving = ref(false);
const uploading = ref(false);
const uploadTarget = ref(null);
const photoFlowRef = ref(null);
const videoInputRef = ref(null);

function syncHeroFromUrls() {
  form.hero_image_url = form.hero_image_urls[0] || '';
  form.hero_image_file_id = form.hero_image_file_ids[0] || '';
}

function alignHeroMediaTypesToUrls() {
  const targetLength = form.hero_image_urls.length;
  while (form.hero_media_types.length < targetLength) {
    form.hero_media_types.push('image');
  }
  if (form.hero_media_types.length > targetLength) {
    form.hero_media_types.splice(targetLength);
  }
}

function alignHeroFileIdsToUrls() {
  const targetLength = form.hero_image_urls.length;
  while (form.hero_image_file_ids.length < targetLength) {
    form.hero_image_file_ids.push('');
  }
  if (form.hero_image_file_ids.length > targetLength) {
    form.hero_image_file_ids.splice(targetLength);
  }
  alignHeroMediaTypesToUrls();
  syncHeroFromUrls();
}

function applySettings(data) {
  const next = createEmptyForm();
  if (data && typeof data === 'object') {
    next.hero_image_urls = resolveHeroImageUrls(data).slice(0, HERO_SLIDESHOW_MAX);
    next.hero_image_url = next.hero_image_urls[0] || '';
    next.hero_image_file_ids = resolveHeroImageFileIds(data).slice(0, next.hero_image_urls.length);
    next.hero_image_file_id = next.hero_image_file_ids[0] || '';
    next.hero_media_types = resolveHeroMediaTypes(data, next.hero_image_urls);
    next.hero_lines_image_url =
      data.hero_lines_image_url != null ? String(data.hero_lines_image_url).trim() : '';
    next.hero_lines_image_file_id =
      data.hero_lines_image_file_id != null ? String(data.hero_lines_image_file_id).trim() : '';
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
    next.about_me_left_image_url =
      data.about_me_left_image_url != null ? String(data.about_me_left_image_url).trim() : '';
    next.about_me_left_image_file_id =
      data.about_me_left_image_file_id != null
        ? String(data.about_me_left_image_file_id).trim()
        : '';
    next.about_me_right_image_url =
      data.about_me_right_image_url != null ? String(data.about_me_right_image_url).trim() : '';
    next.about_me_right_image_file_id =
      data.about_me_right_image_file_id != null
        ? String(data.about_me_right_image_file_id).trim()
        : '';
    next.hero_background_image_url =
      data.hero_background_image_url != null ? String(data.hero_background_image_url).trim() : '';
    next.hero_background_image_file_id =
      data.hero_background_image_file_id != null
        ? String(data.hero_background_image_file_id).trim()
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
  form.hero_media_types.splice(0, form.hero_media_types.length, ...next.hero_media_types);
  form.hero_lines_image_url = next.hero_lines_image_url;
  form.hero_lines_image_file_id = next.hero_lines_image_file_id;
  form.hero_title = next.hero_title;
  form.hero_subtitle = next.hero_subtitle;
  form.featured_title = next.featured_title;
  form.about_title = next.about_title;
  form.hero_quote = next.hero_quote;
  form.about_header = next.about_header;
  form.about_text = next.about_text;
  form.about_image_url = next.about_image_url;
  form.about_image_file_id = next.about_image_file_id;
  form.about_me_left_image_url = next.about_me_left_image_url;
  form.about_me_left_image_file_id = next.about_me_left_image_file_id;
  form.about_me_right_image_url = next.about_me_right_image_url;
  form.about_me_right_image_file_id = next.about_me_right_image_file_id;
  form.hero_background_image_url = next.hero_background_image_url;
  form.hero_background_image_file_id = next.hero_background_image_file_id;
  form.about_background_image_url = next.about_background_image_url;
  form.about_background_image_file_id = next.about_background_image_file_id;
  for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
    Object.assign(form.featured_products[i], next.featured_products[i]);
  }

}

function payloadFromForm() {
  alignHeroFileIdsToUrls();
  const hero_image_urls = form.hero_image_urls
    .map((url) => String(url).trim())
    .filter(Boolean)
    .slice(0, HERO_SLIDESHOW_MAX);
  const hero_image_file_ids = form.hero_image_file_ids
    .slice(0, hero_image_urls.length)
    .map((id) => String(id || '').trim());
  const hero_media_types = form.hero_media_types
    .slice(0, hero_image_urls.length)
    .map((type) => (type === 'video' ? 'video' : 'image'));
  return {
    hero_title: form.hero_title,
    hero_subtitle: form.hero_subtitle,
    hero_image_url: hero_image_urls[0] || '',
    hero_image_urls,
    hero_image_file_id: hero_image_file_ids[0] || '',
    hero_image_file_ids,
    hero_media_types,
    hero_lines_image_url: form.hero_lines_image_url,
    hero_lines_image_file_id: form.hero_lines_image_file_id,
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
    about_me_left_image_url: form.about_me_left_image_url,
    about_me_left_image_file_id: form.about_me_left_image_file_id,
    about_me_right_image_url: form.about_me_right_image_url,
    about_me_right_image_file_id: form.about_me_right_image_file_id,
    hero_background_image_url: form.hero_background_image_url,
    hero_background_image_file_id: form.hero_background_image_file_id,
    about_background_image_url: form.about_background_image_url,
    about_background_image_file_id: form.about_background_image_file_id
  };
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const homeData = await getAdminHomePage();
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
    const payload = payloadFromForm();
    const data = await updateAdminHomePage(payload);
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
  if (target?.type === 'hero' || target?.type === 'hero-add') {
    const slideNumber =
      target.type === 'hero-add'
        ? form.hero_image_urls.length + 1
        : Number(target.index) + 1;
    return {
      editorTitle: `slideshow photo ${slideNumber}`,
      outputFileName: `hero-slide-${slideNumber}.jpg`,
      outputMime: 'image/jpeg',
      preserveSourceFormat: false
    };
  }
  if (target?.type === 'hero-lines') {
    return {
      editorTitle: '.lines photo',
      outputFileName: 'hero-lines.jpg',
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
  if (target?.type === 'about-me-left') {
    return {
      editorTitle: 'about me left photo',
      outputFileName: 'about-me-left.jpg',
      outputMime: 'image/jpeg',
      preserveSourceFormat: false
    };
  }
  if (target?.type === 'about-me-right') {
    return {
      editorTitle: 'about me right photo',
      outputFileName: 'about-me-right.jpg',
      outputMime: 'image/jpeg',
      preserveSourceFormat: false
    };
  }
  return {};
}

function openFilePicker(target) {
  uploadTarget.value = target;
  actionError.value = '';
  if (target?.mediaType === 'video') {
    const input = videoInputRef.value;
    if (input) {
      input.value = '';
      input.click();
    }
    return;
  }
  photoFlowRef.value?.openPicker(editorOptionsForTarget(target));
}

function heroMediaTypeForTarget(target) {
  if (target?.mediaType === 'video') {
    return 'video';
  }
  if (target?.type === 'hero' && Number.isInteger(target.index)) {
    return form.hero_media_types[target.index] === 'video' ? 'video' : 'image';
  }
  return 'image';
}

function setImageUrl(target, url, fileId = '', mediaType = 'image') {
  const resolvedType = mediaType === 'video' ? 'video' : 'image';
  if (target.type === 'hero-add') {
    if (form.hero_image_urls.length >= HERO_SLIDESHOW_MAX) {
      return;
    }
    form.hero_image_urls.push(url);
    form.hero_image_file_ids.push(fileId || '');
    form.hero_media_types.push(resolvedType);
    syncHeroFromUrls();
    return;
  }
  if (target.type === 'hero' && Number.isInteger(target.index)) {
    form.hero_image_urls[target.index] = url;
    while (form.hero_image_file_ids.length < form.hero_image_urls.length) {
      form.hero_image_file_ids.push('');
    }
    while (form.hero_media_types.length < form.hero_image_urls.length) {
      form.hero_media_types.push('image');
    }
    form.hero_image_file_ids[target.index] = fileId || '';
    form.hero_media_types[target.index] = resolvedType;
    syncHeroFromUrls();
    return;
  }
  if (target.type === 'hero-lines') {
    form.hero_lines_image_url = url;
    form.hero_lines_image_file_id = fileId || '';
    return;
  }
  if (target.type === 'about-me-left') {
    form.about_me_left_image_url = url;
    form.about_me_left_image_file_id = fileId || '';
  }
  if (target.type === 'about-me-right') {
    form.about_me_right_image_url = url;
    form.about_me_right_image_file_id = fileId || '';
  }
  if (target.type === 'hero-background') {
    form.hero_background_image_url = url;
    form.hero_background_image_file_id = fileId || '';
  }
}

function uploadFolderForTarget(target) {
  if (
    target?.type === 'hero' ||
    target?.type === 'hero-add' ||
    target?.type === 'hero-lines'
  ) {
    return 'site/hero';
  }
  if (target?.type === 'hero-background') return 'site/hero-background';
  if (target?.type === 'about-me-left' || target?.type === 'about-me-right') return 'site/about';
  return undefined;
}

async function uploadFileForTarget(file) {
  const target = uploadTarget.value;
  if (!target || !file) return;

  uploading.value = true;
  actionError.value = '';
  try {
    const mediaType = heroMediaTypeForTarget(target);
    const uploadFn = mediaType === 'video' ? uploadAdminVideo : uploadAdminImage;
    const { image_url, file_id } = await uploadFn(file, uploadFolderForTarget(target));
    setImageUrl(target, image_url, file_id, mediaType);
    await persistSettings();
  } catch (e) {
    actionError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
    uploadTarget.value = null;
  }
}

async function onVideoPicked(event) {
  const file = event?.target?.files?.[0];
  if (event?.target) {
    event.target.value = '';
  }
  if (!file) {
    uploadTarget.value = null;
    return;
  }
  await uploadFileForTarget(file);
}

async function onPhotoFile(file) {
  await uploadFileForTarget(file);
}

function onPhotoCancel() {
  uploadTarget.value = null;
}

async function clearImage(target) {
  if (target.type === 'hero' && Number.isInteger(target.index)) {
    form.hero_image_urls.splice(target.index, 1);
    form.hero_image_file_ids.splice(target.index, 1);
    form.hero_media_types.splice(target.index, 1);
    syncHeroFromUrls();
    try {
      await persistSettings();
    } catch {
      /* actionError set in persistSettings */
    }
    return;
  }

  if (target.type === 'hero-lines') {
    form.hero_lines_image_url = '';
    form.hero_lines_image_file_id = '';
  }
  if (target.type === 'about-me-left') {
    form.about_me_left_image_url = '';
    form.about_me_left_image_file_id = '';
  }
  if (target.type === 'about-me-right') {
    form.about_me_right_image_url = '';
    form.about_me_right_image_file_id = '';
  }
  if (target.type === 'hero-background') {
    form.hero_background_image_url = '';
    form.hero_background_image_file_id = '';
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

.admin-home__video-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
