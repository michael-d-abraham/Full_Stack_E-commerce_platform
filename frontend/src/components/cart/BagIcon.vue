<template>
  <img
    class="bag-icon"
    :src="bagSrc"
    alt=""
    aria-hidden="true"
    :style="{ width: sizePx, height: sizePx }"
    draggable="false"
  />
</template>

<script setup>
import { computed } from 'vue';
import bagSrc from '../../assets/icons/shopping-bag.png';

const props = defineProps({
  size: {
    type: [Number, String],
    default: 28
  }
});

const sizePx = computed(() => {
  const n = Number(props.size);
  return Number.isFinite(n) ? `${n}px` : String(props.size);
});
</script>

<style scoped>
.bag-icon {
  display: block;
  flex-shrink: 0;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
