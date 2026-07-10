<template>
  <div class="admin-auth">
    <p class="admin-auth__status" aria-live="polite">Completing sign in…</p>
    <AuthenticateWithRedirectCallback />
  </div>
</template>

<script setup>
import { AuthenticateWithRedirectCallback } from '@clerk/vue';
import '../styles/admin-auth.css';
</script>
