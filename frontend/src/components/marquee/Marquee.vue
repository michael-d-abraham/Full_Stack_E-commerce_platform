<template>
  <div
    class="marquee"
    :class="{
      'marquee--vertical': vertical,
      'marquee--reverse': reverse,
      'marquee--pause-on-hover': pauseOnHover
    }"
    :style="rootStyle"
  >
    <div class="marquee__fade marquee__fade--left" aria-hidden="true" />
    <div class="marquee__fade marquee__fade--right" aria-hidden="true" />
    <div class="marquee__viewport">
      <div class="marquee__track">
        <div
          v-for="index in repeat"
          :key="index"
          class="marquee__sequence"
          :aria-hidden="index > 1 ? 'true' : undefined"
          :inert="index > 1 ? true : undefined"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  duration: {
    type: String,
    default: '40s'
  },
  gap: {
    type: String,
    default: '32px'
  },
  fadeColor: {
    type: String,
    default: ''
  },
  fadeWidth: {
    type: String,
    default: ''
  },
  repeat: {
    type: Number,
    default: 2,
    validator: (value) => value >= 1 && value <= 4
  },
  vertical: {
    type: Boolean,
    default: false
  },
  reverse: {
    type: Boolean,
    default: false
  },
  pauseOnHover: {
    type: Boolean,
    default: true
  }
});

const rootStyle = computed(() => {
  const style = {
    '--marquee-duration': props.duration,
    '--marquee-gap': props.gap
  };
  if (props.fadeColor) {
    style['--marquee-fade-color'] = props.fadeColor;
  }
  if (props.fadeWidth) {
    style['--marquee-fade-width'] = props.fadeWidth;
  }
  return style;
});
</script>
