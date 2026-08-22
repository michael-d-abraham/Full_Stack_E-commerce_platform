<template>
  <div class="contact-page">
    <h1 class="page-hero-title">{{ page.page_title }}</h1>

    <div
      class="contact-page__layout"
      :class="{ 'contact-page__layout--no-hero': !page.show_hero_image }"
    >
      <div v-if="page.show_hero_image && page.heroImageUrl" class="contact-page__hero">
        <img
          class="contact-page__hero-img"
          :src="page.heroImageUrl"
          alt="Artist portrait"
        />
      </div>

      <ContactForm field-id-prefix="contact-page" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import ContactForm from '../components/contact/ContactForm.vue';
import { useContactPage } from '../composables/useContactPage.js';

const { page, ensureContactPage } = useContactPage();

onMounted(() => {
  ensureContactPage();
});
</script>
