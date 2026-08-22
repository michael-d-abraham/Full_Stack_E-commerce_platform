<template>
  <div class="admin-page admin-schedule">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Schedule</h1>
      <p class="admin-page-header__status">
        Manage the booking page and Square appointment link shown on the storefront.
      </p>
    </header>

    <section class="admin-float admin-float--padded">
      <AdminBookPage save-label="Save schedule" />
    </section>
  </div>
</template>

<script setup>
import AdminBookPage from '../AdminBookPage.vue';
</script>

<style scoped>
.admin-schedule .admin-page-header__status {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}
</style>
