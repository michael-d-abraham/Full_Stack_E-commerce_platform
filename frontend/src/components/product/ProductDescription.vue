<template>
  <div v-if="hasContent" class="product-description">
    <p
      ref="textRef"
      class="product-description__text"
      :class="{ 'product-description__text--collapsed': collapsible && !expanded }"
      :style="collapsedStyle"
    >
      {{ displayText }}
    </p>
    <button
      v-if="collapsible && isTruncatable"
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

const collapsedStyle = computed(() => {
  if (!props.collapsible || expanded.value) {
    return undefined;
  }
  return { '--product-description-clamp': String(props.collapsedLines) };
});

async function updateTruncation() {
  if (!props.collapsible) {
    isTruncatable.value = false;
    return;
  }

  await nextTick();
  const el = textRef.value;
  if (!el || !hasContent.value) {
    isTruncatable.value = false;
    return;
  }

  const wasExpanded = expanded.value;
  expanded.value = false;
  await nextTick();

  isTruncatable.value = el.scrollHeight > el.clientHeight + 1;
  expanded.value = wasExpanded;
}

watch(displayText, () => {
  expanded.value = false;
  updateTruncation();
});

watch(expanded, updateTruncation);

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
  margin-top: var(--space-md);
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 0.3em;
  cursor: pointer;
}

.product-description__read-more:hover {
  opacity: 0.55;
}
</style>
