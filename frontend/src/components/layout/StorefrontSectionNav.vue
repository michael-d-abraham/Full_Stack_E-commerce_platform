<template>
  <template v-for="item in navItems" :key="item.id">
    <a
      :href="`/${storefrontHash(item.id)}`"
      :class="[linkClass, { [activeClass]: activeSectionId === item.id }]"
      @click="goToSection($event, item.id)"
    >
      {{ item.label }}
    </a>
  </template>
</template>

<script setup>
import { storefrontHash } from '../../constants/storefrontSections.js';
import { useStorefrontSectionNav } from '../../composables/useStorefrontSectionNav.js';

defineProps({
  linkClass: {
    type: String,
    required: true
  },
  activeClass: {
    type: String,
    required: true
  }
});

const { navItems, activeSectionId, goToSection } = useStorefrontSectionNav();
</script>
