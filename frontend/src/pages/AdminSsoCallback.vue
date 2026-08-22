<template>
  <div class="admin-auth">
    <AdminClerkSetupNotice v-if="!clerkEnabled" />
    <template v-else>
      <p class="admin-auth__status" aria-live="polite">Completing sign in…</p>
      <AuthenticateWithRedirectCallback />
    </template>
  </div>
</template>

<script setup>
import { AuthenticateWithRedirectCallback } from '@clerk/vue';
import AdminClerkSetupNotice from '../components/admin/AdminClerkSetupNotice.vue';
import { clerkIsEnabled } from '../composables/useClerkWhenEnabled.js';
import '../styles/admin-auth.css';

const clerkEnabled = clerkIsEnabled();
</script>
