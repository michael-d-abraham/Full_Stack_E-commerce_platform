<template>
  <div class="page-reveal">
    <div v-if="!ready && $slots.skeleton" class="page-reveal__skeleton" aria-busy="true">
      <slot name="skeleton" />
    </div>
    <div
      v-show="ready || !$slots.skeleton"
      class="page-reveal__content"
      :class="{
        'is-ready': ready,
        'is-instant': instantReady
      }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  ready: {
    type: Boolean,
    default: false
  }
});

// Cached first paint: show immediately without opacity fade.
const instantReady = ref(Boolean(props.ready));

watch(
  () => props.ready,
  (next, prev) => {
    if (next && !prev) {
      instantReady.value = false;
    }
    if (!next) {
      instantReady.value = false;
    }
  }
);
</script>
