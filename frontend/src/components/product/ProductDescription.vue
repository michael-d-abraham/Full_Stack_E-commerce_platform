<template>
  <div v-if="hasContent" class="product-description">
    <p
      v-show="showText"
      ref="textRef"
      class="product-description__text"
      :class="{ 'product-description__text--collapsed': isLineClamped }"
      :style="collapsedStyle"
    >
      {{ displayText }}
    </p>
    <button
      v-if="showToggle"
      type="button"
      class="product-description__read-more"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Read less' : 'Read more' }}
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  metaLines: {
    type: Array,
    default: () => []
  },
  collapsible: {
    type: Boolean,
    default: false
  },
  collapsedLines: {
    type: Number,
    default: 2
  }
});

const expanded = ref(false);
const textRef = ref(null);
const isTruncatable = ref(false);

const bodyText = computed(() => String(props.text || '').trim());

const displayText = computed(() => {
  const meta = props.metaLines.map((line) => String(line || '').trim()).filter(Boolean);
  const parts = [...meta];
  if (bodyText.value) {
    if (parts.length) {
      parts.push('');
    }
    parts.push(bodyText.value);
  }
  return parts.join('\n');
});

const hasContent = computed(() => Boolean(displayText.value));

const collapseFully = computed(
  () => props.collapsible && props.collapsedLines <= 0
);

const showText = computed(() => {
  if (!props.collapsible) {
    return true;
  }
  if (collapseFully.value) {
    return expanded.value;
  }
  return true;
});

const isLineClamped = computed(
  () => props.collapsible && !collapseFully.value && !expanded.value
);

const showToggle = computed(() => {
  if (!props.collapsible || !hasContent.value) {
    return false;
  }
  if (collapseFully.value) {
    return true;
  }
  return isTruncatable.value || expanded.value;
});

const collapsedStyle = computed(() => {
  if (!isLineClamped.value) {
    return undefined;
  }
  return { '--product-description-clamp': String(props.collapsedLines) };
});

async function updateTruncation() {
  if (!props.collapsible || collapseFully.value) {
    isTruncatable.value = false;
    return;
  }

  await nextTick();
  const el = textRef.value;
  if (!el || !hasContent.value) {
    isTruncatable.value = false;
    return;
  }

  // Only measure while collapsed. Remeasuring while expanded previously
  // cleared isTruncatable and hid the Read less control.
  if (expanded.value) {
    return;
  }

  isTruncatable.value = el.scrollHeight > el.clientHeight + 1;
}

watch(displayText, () => {
  expanded.value = false;
  updateTruncation();
});

watch(
  () => props.collapsedLines,
  () => {
    expanded.value = false;
    updateTruncation();
  }
);

onMounted(updateTruncation);
</script>

<style scoped>
.product-description {
  margin: 0;
  padding: 0;
}

.product-description__text {
  margin: 0;
  white-space: pre-line;
  line-height: 1.65;
  font-size: 0.875rem;
  font-weight: 300;
  letter-spacing: 0.02em;
  color: var(--color-text-muted);
}

.product-description__text--collapsed {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--product-description-clamp, 2);
  overflow: hidden;
}

.product-description__read-more {
  margin-top: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: lowercase;
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 0.3em;
  cursor: pointer;
}

.product-description__text + .product-description__read-more {
  margin-top: var(--space-md);
}

.product-description__read-more:hover {
  opacity: 0.55;
}
</style>
