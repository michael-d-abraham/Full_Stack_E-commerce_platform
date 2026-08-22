<template>
  <figure
    ref="figureRef"
    class="testimonial-card"
    :class="{ 'testimonial-card--spotlight-active': spotlightActive }"
    :style="spotlightVars"
    tabindex="0"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @focus="onFocus"
    @blur="onBlur"
  >
    <div class="testimonial-card__spotlight" aria-hidden="true" />
    <div class="testimonial-card__inner">
      <img
        class="testimonial-card__avatar"
        :src="avatarUrl"
        :alt="''"
        width="44"
        height="44"
        loading="lazy"
        decoding="async"
      >
      <blockquote class="testimonial-card__quote">
        {{ quote }}
      </blockquote>
      <footer class="testimonial-card__footer">
        <cite class="testimonial-card__name">{{ name }}</cite>
        <p class="testimonial-card__role">{{ role }}</p>
      </footer>
    </div>
  </figure>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';

const props = defineProps({
  quote: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String,
    required: true
  }
});

const figureRef = ref(null);
const isFocused = ref(false);
const isHovering = ref(false);
const position = ref({ x: 0, y: 0 });

const isHoverDevice = useMediaQuery('(hover: hover)');

const spotlightActive = computed(
  () => isHoverDevice.value && isHovering.value && !isFocused.value
);

const spotlightVars = computed(() => ({
  '--spotlight-x': `${position.value.x}px`,
  '--spotlight-y': `${position.value.y}px`
}));

function onMouseMove(event) {
  if (!isHoverDevice.value || isFocused.value || !figureRef.value) {
    return;
  }
  const rect = figureRef.value.getBoundingClientRect();
  position.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  isHovering.value = true;
}

function onMouseLeave() {
  isHovering.value = false;
}

function onFocus() {
  isFocused.value = true;
  isHovering.value = false;
}

function onBlur() {
  isFocused.value = false;
}

onMounted(() => {
  if (!figureRef.value) {
    return;
  }
  const rect = figureRef.value.getBoundingClientRect();
  position.value = { x: rect.width / 2, y: rect.height / 2 };
});
</script>
