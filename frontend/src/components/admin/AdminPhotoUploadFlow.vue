<template>
  <input
    ref="inputRef"
    type="file"
    :accept="ACCEPTED_IMAGE_TYPES"
    class="photo-flow__input"
    :disabled="disabled"
    @change="onFilePicked"
  />

  <AdminPhotoEditor
    :open="editorOpen"
    :src="previewSrc"
    :title="session.editorTitle"
    :free-aspect="session.freeAspect"
    :aspect-ratio="session.aspectRatio"
    :show-orientation-tools="session.showOrientationTools"
    :output-file-name="session.outputFileName"
    :output-mime="session.outputMime"
    :output-quality="session.outputQuality"
    @apply="onEditorApply"
    @cancel="onEditorCancel"
  />
</template>

<script setup>
import { ref, reactive } from 'vue';
import AdminPhotoEditor from './AdminPhotoEditor.vue';
import { resolveEditorOutputFromSource } from '@shared/imageOutputFormat.js';

const ACCEPTED_IMAGE_TYPES =
  'image/png,image/webp,image/svg+xml,image/jpeg,image/jpg';

const props = defineProps({
  disabled: { type: Boolean, default: false },
  /** When false, the chosen file is emitted without opening the editor. */
  offerEditor: { type: Boolean, default: true },
  editorTitle: { type: String, default: 'Edit photo' },
  freeAspect: { type: Boolean, default: true },
  aspectRatio: { type: Number, default: 4 / 5 },
  showOrientationTools: { type: Boolean, default: true },
  outputFileName: { type: String, default: 'photo.jpg' },
  outputMime: { type: String, default: 'image/jpeg' },
  outputQuality: { type: Number, default: 0.92 },
  /** When true, export format follows the picked file (PNG/WebP/SVG/JPEG). */
  preserveSourceFormat: { type: Boolean, default: false },
  /** Base name for exports when preserveSourceFormat is enabled (no extension). */
  outputBaseName: { type: String, default: 'photo' }
});

const emit = defineEmits(['file', 'cancel']);

const inputRef = ref(null);
const editorOpen = ref(false);
const previewSrc = ref('');

const session = reactive({
  editorTitle: props.editorTitle,
  freeAspect: props.freeAspect,
  aspectRatio: props.aspectRatio,
  showOrientationTools: props.showOrientationTools,
  outputFileName: props.outputFileName,
  outputMime: props.outputMime,
  outputQuality: props.outputQuality,
  outputBaseName: props.outputBaseName,
  preserveSourceFormat: props.preserveSourceFormat
});

function syncSessionFromProps() {
  session.editorTitle = props.editorTitle;
  session.freeAspect = props.freeAspect;
  session.aspectRatio = props.aspectRatio;
  session.showOrientationTools = props.showOrientationTools;
  session.outputFileName = props.outputFileName;
  session.outputMime = props.outputMime;
  session.outputQuality = props.outputQuality;
  session.outputBaseName = props.outputBaseName;
  session.preserveSourceFormat = props.preserveSourceFormat;
}

function revokePreview() {
  if (previewSrc.value && previewSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewSrc.value);
  }
  previewSrc.value = '';
}

function closeEditor() {
  editorOpen.value = false;
  revokePreview();
}

/**
 * Opens the system file picker. Pass overrides for one-off editor settings
 * (e.g. hero vs about file name).
 */
function openPicker(overrides = {}) {
  if (props.disabled) return;
  syncSessionFromProps();
  Object.assign(session, overrides);
  inputRef.value?.click();
}

function onFilePicked(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;

  if (!props.offerEditor) {
    emit('file', file);
    return;
  }

  if (session.preserveSourceFormat) {
    const resolved = resolveEditorOutputFromSource({
      sourceMime: file.type,
      sourceName: file.name,
      outputBaseName: session.outputBaseName || props.outputBaseName
    });
    session.outputMime = resolved.outputMime;
    session.outputFileName = resolved.outputFileName;
    session.outputQuality =
      resolved.outputQuality != null ? resolved.outputQuality : props.outputQuality;

    if (resolved.skipEditor) {
      emit('file', file);
      return;
    }
  }

  revokePreview();
  previewSrc.value = URL.createObjectURL(file);
  editorOpen.value = true;
}

function onEditorApply(file) {
  closeEditor();
  emit('file', file);
}

function onEditorCancel() {
  closeEditor();
  emit('cancel');
}

defineExpose({ openPicker });
</script>

<style scoped>
.photo-flow__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}
</style>
