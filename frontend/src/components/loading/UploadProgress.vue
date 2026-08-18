<template>
  <div class="upload-progress" role="status" aria-live="polite">
    <div class="upload-progress__track">
      <div
        class="upload-progress__bar"
        :class="{ 'is-determinate': progress != null }"
        :style="barStyle"
      />
    </div>
    <p v-if="label" class="upload-progress__label">{{ label }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** 0–100 for determinate; null for indeterminate */
  progress: {
    type: Number,
    default: null
  },
  label: {
    type: String,
    default: 'Uploading…'
  }
});

const barStyle = computed(() => {
  if (props.progress == null) {
    return undefined;
  }
  const clamped = Math.max(0, Math.min(100, props.progress));
  return { width: `${clamped}%` };
});
</script>
