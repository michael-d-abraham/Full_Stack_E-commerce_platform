<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="transitionNameFor(route)">
      <component :is="Component" :key="viewKey(route)" />
    </Transition>
  </RouterView>
</template>

<script setup>
import { RouterView } from 'vue-router';

function transitionNameFor(route) {
  // Gallery product overlay keeps the grid mounted — no route fade.
  if (route.name === 'gallery') {
    return '';
  }
  return 'route-transition';
}

function viewKey(route) {
  if (route.name === 'gallery') {
    return 'gallery';
  }
  if (route.name === 'product-detail') {
    return `product-${route.params.slug || ''}`;
  }
  // Prefer stable name keys so query-only changes do not remount the page.
  if (route.name) {
    return String(route.name);
  }
  return route.path;
}
</script>
