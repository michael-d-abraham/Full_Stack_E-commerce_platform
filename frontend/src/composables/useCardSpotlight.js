import { computed, onMounted, ref } from 'vue';
import { useMediaQuery } from './useMediaQuery.js';

export function useCardSpotlight() {
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

  return {
    figureRef,
    spotlightActive,
    spotlightVars,
    onMouseMove,
    onMouseLeave,
    onFocus,
    onBlur
  };
}
