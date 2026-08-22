<template>
  <StorefrontProductGridPage
    route-name="wanna-dos"
    :page-title="wannaDosPageTitle"
    :empty-message="wannaDosEmptyMessage"
    :section-label="wannaDosSectionLabel"
  />
</template>

<script setup>
import StorefrontProductGridPage from '../components/product/StorefrontProductGridPage.vue';
import { useStorefrontLabels } from '../composables/useStorefrontLabels.js';

const { wannaDosPageTitle, wannaDosEmptyMessage, wannaDosSectionLabel } = useStorefrontLabels();
</script>
