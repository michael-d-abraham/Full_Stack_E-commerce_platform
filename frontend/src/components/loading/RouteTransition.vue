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
  // Admin tab changes should swap in place — no full-shell fade/remount.
  if (route.path.startsWith('/admin')) {
    return '';
  }
  // Product grid overlay keeps the grid mounted — no route fade.
  if (route.name === 'gallery' || route.name === 'wanna-dos') {
    return '';
  }
  return 'route-transition';
}

function viewKey(route) {
  if (route.path.startsWith('/admin')) {
    return 'admin-shell';
  }
  if (route.name === 'gallery' || route.name === 'wanna-dos') {
    return route.name;
  }
  // Prefer stable name keys so query-only changes do not remount the page.
  if (route.name) {
    return String(route.name);
  }
  return route.path;
}
</script>
