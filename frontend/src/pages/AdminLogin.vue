<script setup>
import { defineAsyncComponent } from 'vue';
import { isClerkEnabled } from '../utils/clerkConfig.js';

const AdminLoginClerk = defineAsyncComponent(() => import('./AdminLoginClerk.vue'));
const AdminLoginLegacy = defineAsyncComponent(() => import('./AdminLoginLegacy.vue'));
</script>

<template>
  <AdminLoginLegacy v-if="!isClerkEnabled()" />
  <AdminLoginClerk v-else />
</template>
