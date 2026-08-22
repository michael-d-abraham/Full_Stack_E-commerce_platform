<template>
  <section
    id="my-art"
    class="home-my-art home-section"
    aria-labelledby="home-my-art-heading"
  >
    <div class="home-placeholder__container mobile-safe-container">
      <header class="home-placeholder__masthead">
        <h2 id="home-my-art-heading" class="home-placeholder__title">my art</h2>
        <div class="home-placeholder__divider" aria-hidden="true" />
      </header>
    </div>
    <HomeMyArtMarquee />
  </section>
</template>

<script setup>
import HomeMyArtMarquee from './HomeMyArtMarquee.vue';
</script>
