<template>
  <div v-if="active" class="viewport-debug-panel" aria-hidden="true">
    <div class="viewport-debug-panel__title">viewportDebug</div>
    <dl class="viewport-debug-panel__metrics">
      <template v-for="row in metricRows" :key="row.key">
        <dt>{{ row.key }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
    </dl>
    <div class="viewport-debug-panel__log-title">events</div>
    <ul class="viewport-debug-panel__log">
      <li v-for="(entry, index) in logEntries" :key="`${entry.t}-${index}`">
        {{ formatLogEntry(entry) }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  viewportDebugActive,
  viewportDebugMetrics,
  viewportDebugLog
} from '../../composables/useViewportDebug.js';

const active = viewportDebugActive;
const metrics = viewportDebugMetrics;
const logEntries = viewportDebugLog;

const metricRows = computed(() => {
  const m = metrics.value || {};
  return [
    { key: 'innerHeight', value: fmt(m.innerHeight) },
    { key: 'outerHeight', value: fmt(m.outerHeight) },
    { key: 'clientHeight', value: fmt(m.clientHeight) },
    { key: 'vv.height', value: fmt(m.visualViewportHeight) },
    { key: 'vv.offsetTop', value: fmt(m.visualViewportOffsetTop) },
    { key: 'scrollY', value: fmt(m.scrollY) },
    { key: 'body.position', value: m.bodyPosition },
    { key: 'body.top', value: m.bodyTop },
    { key: 'overlay.h', value: fmt(m.overlayHeight) },
    { key: 'card.h', value: fmt(m.cardHeight) },
    { key: 'card.max-h', value: m.cardMaxHeight ?? '—' },
    { key: 'details.clientH', value: fmt(m.detailsClientHeight) },
    { key: 'details.scrollTop', value: fmt(m.detailsScrollTop) },
    { key: 'gallery.h', value: fmt(m.galleryHeight) },
    { key: 'commit', value: m.commitSha },
    { key: 'mode', value: m.buildMode }
  ];
});

function fmt(value) {
  if (value == null) {
    return '—';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return String(value);
}

function formatLogEntry(entry) {
  const { source, t, ...rest } = entry;
  const detail = Object.entries(rest)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  return `${new Date(t).toISOString().slice(11, 23)} ${source}${detail ? ` ${detail}` : ''}`;
}
</script>

<style scoped>
.viewport-debug-panel {
  position: fixed;
  left: 4px;
  bottom: 4px;
  z-index: 100000;
  width: min(92vw, 320px);
  max-height: 42vh;
  overflow: auto;
  pointer-events: none;
  font: 10px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #e8ffe8;
  background: rgba(0, 0, 0, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px 8px;
  box-sizing: border-box;
}

.viewport-debug-panel__title {
  font-weight: 700;
  margin-bottom: 4px;
}

.viewport-debug-panel__metrics {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1px 8px;
  margin: 0;
}

.viewport-debug-panel__metrics dt {
  margin: 0;
  opacity: 0.75;
}

.viewport-debug-panel__metrics dd {
  margin: 0;
  word-break: break-all;
}

.viewport-debug-panel__log-title {
  margin-top: 6px;
  font-weight: 700;
}

.viewport-debug-panel__log {
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
}

.viewport-debug-panel__log li {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
