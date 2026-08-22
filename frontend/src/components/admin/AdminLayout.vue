<template>
  <div class="admin-shell">
    <AdminSidebar />

    <div class="admin-shell__content">
      <header class="admin-shell__mobile-header">
        <div class="admin-shell__mobile-bar">
          <button
            type="button"
            class="admin-shell__menu-toggle"
            :aria-label="adminMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
            :aria-expanded="adminMenuOpen"
            @click="toggleAdminMenu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <SiteBrandMark
            to="/admin/dashboard"
            variant="admin"
            class="admin-shell__mobile-brand"
            :aria-label="brandAdminHomeAriaLabel"
          />
        </div>
        <AdminNavDrawer />
      </header>

      <main class="admin-shell__main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import AdminSidebar from './AdminSidebar.vue';
import AdminNavDrawer from './AdminNavDrawer.vue';
import SiteBrandMark from '../brand/SiteBrandMark.vue';
import { useAdminNav } from '../../composables/useAdminNav.js';
import { useSiteBrand } from '../../composables/useSiteBrand.js';
import { prefetchRouteChunks } from '../../utils/routePrefetch.js';

const route = useRoute();
const { brandAdminHomeAriaLabel } = useSiteBrand();
const { adminMenuOpen, toggleAdminMenu, closeAdminMenu } = useAdminNav();

function setBodyMenuLock(open) {
  document.body.classList.toggle('admin-menu-open', open);
}

function onEscape(event) {
  if (event.key === 'Escape' && adminMenuOpen.value) {
    closeAdminMenu();
  }
}

watch(
  () => route.fullPath,
  () => {
    closeAdminMenu();
  }
);

watch(adminMenuOpen, (open) => {
  setBodyMenuLock(open);
});

onMounted(() => {
  window.addEventListener('keydown', onEscape);
  prefetchRouteChunks(['adminDashboard']);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onEscape);
  closeAdminMenu();
  setBodyMenuLock(false);
});
</script>

<style scoped>
.admin-shell {
  --admin-sidebar-width: 15.5rem;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-sizing: border-box;
}

.admin-shell__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.admin-shell__mobile-header {
  position: sticky;
  top: 0;
  z-index: 1100;
  background: #fff;
  border-bottom: none;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
}

.admin-shell__mobile-bar {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  min-height: 56px;
  padding: 0.75rem max(16px, env(safe-area-inset-left)) 0.75rem max(16px, env(safe-area-inset-right));
  box-sizing: border-box;
}

.admin-shell__menu-toggle {
  grid-column: 1;
  justify-self: start;
  width: 44px;
  height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  box-shadow: none;
  letter-spacing: 0;
  text-transform: none;
}

.admin-shell__menu-toggle span {
  width: 22px;
  height: 2px;
  background: #000;
  display: block;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.admin-shell__menu-toggle[aria-expanded='true'] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.admin-shell__menu-toggle[aria-expanded='true'] span:nth-child(2) {
  opacity: 0;
}

.admin-shell__menu-toggle[aria-expanded='true'] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.admin-shell__mobile-brand {
  grid-column: 2;
  justify-self: center;
  padding: 0 0.5rem;
  text-decoration: none;
  color: #1a1a1a;
  line-height: 1;
}

.admin-shell__main {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: var(--space-xl) var(--space-lg) var(--space-3xl);
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .admin-shell {
    flex-direction: row;
    overflow: hidden;
    min-height: 0;
  }

  .admin-shell__content {
    margin-left: var(--admin-sidebar-width);
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  .admin-shell__mobile-header {
    display: none;
  }

  .admin-shell__main {
    padding: 2rem 2.5rem 3rem;
    flex: 1 1 auto;
    min-height: 0;
    height: 0;
  }
}

@media (max-width: 767px) {
  .admin-shell__content {
    min-height: 0;
    flex: 1 1 auto;
  }

  .admin-shell__main {
    padding: 1.25rem max(16px, env(safe-area-inset-left)) max(2rem, env(safe-area-inset-bottom))
      max(16px, env(safe-area-inset-right));
    overflow-x: clip;
    flex: 1 1 auto;
    min-height: 0;
    height: 0;
  }
}
</style>
