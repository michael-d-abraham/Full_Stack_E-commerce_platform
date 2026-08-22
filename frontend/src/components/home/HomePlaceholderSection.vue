<template>
  <section
    :id="sectionId"
    class="home-placeholder home-section"
    :class="sectionClass"
    :aria-labelledby="headingId"
  >
    <div class="home-placeholder__container mobile-safe-container">
      <header class="home-placeholder__masthead">
        <h2 :id="headingId" class="home-placeholder__title">{{ title }}</h2>
        <div class="home-placeholder__divider" aria-hidden="true" />
      </header>
      <p v-if="copy" class="home-placeholder__copy">{{ copy }}</p>
      <div v-if="showMedia" class="home-placeholder__media" aria-hidden="true" />
      <router-link v-if="ctaTo" :to="ctaTo" class="home-placeholder__cta">
        {{ ctaLabel }}
      </router-link>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  copy: { type: String, default: '' },
  sectionClass: { type: String, default: '' },
  headingId: { type: String, required: true },
  sectionId: { type: String, default: '' },
  showMedia: { type: Boolean, default: false },
  ctaTo: { type: String, default: '' },
  ctaLabel: { type: String, default: '' }
});
</script>
