<template>
  <div class="admin-product-images" :class="{ 'is-disabled': disabled }">
    <p class="help">{{ helpText }}</p>
    <p v-if="uploadError" class="error">{{ uploadError }}</p>

    <div v-for="(img, j) in rows" :key="img.id || img.url || j" class="image-row">
      <img v-if="img.url" class="thumb" :src="img.url" alt="" />
      <span v-else class="thumb thumb--empty">No preview</span>
      <label v-if="rowsWithUrl.length > 1" class="primary-pick">
        <input
          type="radio"
          name="primary-img"
          :checked="primaryIndex === j"
          :disabled="disabled || uploading"
          @change="setPrimary(j)"
        />
        Main
      </label>
      <button type="button" class="btn-remove" :disabled="disabled || uploading" @click="removeRow(j)">
        Remove
      </button>
    </div>

    <div v-if="canAddMore" class="upload-row">
      <button
        type="button"
        class="upload-trigger"
        :disabled="disabled || uploading"
        @click="openUpload"
      >
        {{ addLabel }}
      </button>
      <UploadProgress v-if="uploading" />
    </div>

    <AdminPhotoUploadFlow
      ref="photoFlowRef"
      :offer-editor="offerPhotoEditor"
      editor-title="Product photo"
      free-aspect
      show-orientation-tools
      output-file-name="product.jpg"
      :disabled="disabled || uploading"
      @file="onPhotoFile"
      @cancel="onPhotoCancel"
    />
  </div>
</template>

<script>
export function buildProductImagesPayload(rows, primaryIndex) {
  const withIdx = (rows || [])
    .map((r, i) => ({
      url: String(r.url || '').trim(),
      image_provider_id:
        r.image_provider_id != null ? String(r.image_provider_id).trim() : '',
      i
    }))
    .filter((x) => x.url);
  if (!withIdx.length) return [];
  let primaryPos = withIdx.findIndex((x) => x.i === primaryIndex);
  if (primaryPos < 0) primaryPos = 0;
  return withIdx.map((xr, j) => {
    const payload = {
      image_url: xr.url,
      is_primary: j === primaryPos
    };
    if (xr.image_provider_id) {
      payload.image_provider_id = xr.image_provider_id;
    }
    return payload;
  });
}
</script>

<script setup>
import { ref, computed, watch } from 'vue';
import { uploadAdminImage } from '../../services/api.js';
import AdminPhotoUploadFlow from './AdminPhotoUploadFlow.vue';
import UploadProgress from '../loading/UploadProgress.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  primaryIndex: {
    type: Number,
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  /** Offer edit vs upload-original when adding a product photo. */
  offerPhotoEditor: {
    type: Boolean,
    default: true
  },
  /** ImageKit Media Library folder (default: products). */
  uploadFolder: {
    type: String,
    default: 'products'
  },
  /** When set, limits how many photos can be attached (e.g. 1 for Wanna Do's). */
  maxImages: {
    type: Number,
    default: null
  },
  helpText: {
    type: String,
    default: 'Upload photos. Mark one as main.'
  },
  addLabel: {
    type: String,
    default: 'Add photo'
  }
});

const emit = defineEmits(['update:modelValue', 'update:primaryIndex']);

const rows = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const primaryIndex = computed({
  get: () => props.primaryIndex,
  set: (val) => emit('update:primaryIndex', val)
});

const rowsWithUrl = computed(() =>
  rows.value.map((r) => String(r.url || '').trim()).filter(Boolean)
);

const canAddMore = computed(() => {
  if (props.maxImages == null) {
    return true;
  }
  return rowsWithUrl.value.length < props.maxImages;
});

const uploading = ref(false);
const uploadError = ref('');
const photoFlowRef = ref(null);

function setPrimary(index) {
  primaryIndex.value = index;
}

function removeRow(index) {
  const next = [...rows.value];
  next.splice(index, 1);
  rows.value = next;
  if (primaryIndex.value >= next.length) {
    primaryIndex.value = Math.max(0, next.length - 1);
  }
  if (next.length && !next.some((_, i) => i === primaryIndex.value)) {
    primaryIndex.value = 0;
  }
}

function ensurePrimaryIfNeeded() {
  const urls = rows.value.filter((r) => String(r.url || '').trim());
  if (urls.length && primaryIndex.value >= rows.value.length) {
    primaryIndex.value = 0;
  }
}

function openUpload() {
  if (props.disabled || !canAddMore.value) return;
  uploadError.value = '';
  photoFlowRef.value?.openPicker();
}

async function onPhotoFile(file) {
  if (!file || props.disabled || !canAddMore.value) return;

  uploading.value = true;
  uploadError.value = '';
  try {
    const { image_url, file_id } = await uploadAdminImage(file, props.uploadFolder);
    const next = [...rows.value, { url: image_url, image_provider_id: file_id || '' }];
    rows.value = next;
    if (next.length === 1) {
      primaryIndex.value = 0;
    }
  } catch (e) {
    uploadError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

function onPhotoCancel() {
  /* no-op */
}

function buildPayload() {
  return buildProductImagesPayload(rows.value, primaryIndex.value);
}

defineExpose({ buildPayload });

watch(
  () => rows.value.length,
  () => ensurePrimaryIfNeeded()
);
</script>

<style scoped>
.admin-product-images {
  margin-top: var(--space-xs);
}

.help {
  margin: 0 0 var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.error {
  margin: 0 0 var(--space-sm);
  color: var(--color-error, var(--color-error));
  font-size: 0.875rem;
}

.image-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}

.thumb {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: cover;
  border: 1px solid var(--color-border, var(--color-border));
  background: var(--color-surface-muted, var(--color-surface));
}

.thumb--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: var(--color-text-muted);
  text-align: center;
}

.primary-pick {
  font-weight: normal;
  white-space: nowrap;
  font-size: 0.875rem;
}

.btn-remove {
  font-size: 0.875rem;
}

.upload-row {
  margin-top: var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.upload-trigger {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.upload-trigger:hover:not(:disabled) {
  opacity: 0.65;
}

.upload-trigger:disabled {
  opacity: 0.5;
  cursor: wait;
}

.upload-status {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-product-images.is-disabled {
  opacity: 0.7;
  pointer-events: none;
}
</style>
