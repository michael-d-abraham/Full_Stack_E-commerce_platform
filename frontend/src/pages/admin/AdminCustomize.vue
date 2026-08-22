<template>
  <div class="admin-page admin-customize">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Customize</h1>
    </header>

    <section class="admin-float admin-float--padded">
      <h2 class="admin-float-card__title">Site name</h2>
      <AdminSiteBranding />
    </section>

    <section class="admin-float admin-float--padded">
      <h2 class="admin-float-card__title">Home page</h2>
      <AdminHomePage />
    </section>

    <section class="admin-float admin-float--padded">
      <h2 class="admin-float-card__title">Contact page</h2>
      <AdminDisplayPictures />
    </section>

    <section class="admin-float admin-float--padded">
      <h2 class="admin-float-card__title">Footer</h2>
      <AdminSocialLinks />
    </section>
  </div>
</template>

<script setup>
import AdminHomePage from '../AdminHomePage.vue';
import AdminSiteBranding from '../AdminSiteBranding.vue';
import AdminDisplayPictures from '../AdminDisplayPictures.vue';
import AdminSocialLinks from '../AdminSocialLinks.vue';
</script>
