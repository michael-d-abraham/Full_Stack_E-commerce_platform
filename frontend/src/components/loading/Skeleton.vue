<template>
  <span
    class="skeleton"
    :class="variantClass"
    :style="styleVars"
    aria-hidden="true"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'text',
    validator: (value) =>
      [
        'text',
        'title',
        'price',
        'line',
        'line-short',
        'button',
        'card',
        'table-row',
        'avatar',
        'quantity',
        'availability'
      ].includes(value)
  },
  width: {
    type: [String, Number],
    default: null
  },
  height: {
    type: [String, Number],
    default: null
  }
});

const variantClass = computed(() => {
  if (props.variant === 'line-short') {
    return ['skeleton--line', 'skeleton--line-short'];
  }
  return `skeleton--${props.variant}`;
});

const styleVars = computed(() => {
  const style = {};
  if (props.width != null) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.height != null) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  return style;
});
</script>
