<template>
  <Teleport to="body">
    <button
      v-if="adminMenuOpen"
      type="button"
      class="admin-nav-backdrop"
      aria-label="Close menu"
      tabindex="-1"
      @click="closeAdminMenu"
    />
  </Teleport>
  <nav
    class="admin-nav-drawer"
    :class="{ 'admin-nav-drawer--open': adminMenuOpen }"
    aria-label="Admin menu"
    :aria-hidden="!adminMenuOpen"
    @click.stop
  >
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="admin-nav-drawer__link"
      :class="{ 'admin-nav-drawer__link--active': isNavActive(item.to) }"
      @click="closeAdminMenu"
    >
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useAdminNav } from '../../composables/useAdminNav.js';
import { ADMIN_NAV_ITEMS, isAdminNavActive } from '../../constants/adminNavItems.js';

const route = useRoute();
const { adminMenuOpen, closeAdminMenu } = useAdminNav();
const navItems = ADMIN_NAV_ITEMS;

function isNavActive(path) {
    return isAdminNavActive(route.path, path);
}
</script>

<style scoped>
.admin-nav-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1098;
  margin: 0;
  padding: 0;
  border: none;
  background: var(--color-overlay-backdrop);
  cursor: default;
}

.admin-nav-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1101;
  display: none;
  flex-direction: column;
  align-items: stretch;
  gap: 0.25rem;
  padding: 0.75rem max(16px, env(safe-area-inset-left)) 1.25rem max(16px, env(safe-area-inset-right));
  background: var(--color-highlight);
  border-bottom: none;
  box-shadow: var(--shadow-admin-drawer);
  box-sizing: border-box;
  max-height: min(70vh, calc(100dvh - 4.5rem));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.admin-nav-drawer--open {
  display: flex;
}

.admin-nav-drawer__link {
  color: var(--color-text);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: none;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  width: 100%;
  border-radius: 8px;
}

.admin-nav-drawer__link:hover {
  background: var(--color-overlay-subtle);
  opacity: 1;
  text-decoration: none;
}

.admin-nav-drawer__link--active {
  background: var(--color-border);
  color: var(--color-heading);
  font-weight: 600;
}

@media (min-width: 768px) {
  .admin-nav-backdrop,
  .admin-nav-drawer {
    display: none !important;
  }
}
</style>
