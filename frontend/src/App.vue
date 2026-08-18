<template>
  <div class="app">
    <SiteHeader
      v-if="!isAdminRoute"
      ref="siteHeaderRef"
      :hide-for-gallery-product="hideHeaderForGalleryProduct"
    />
    <CartDrawer v-if="!isAdminRoute && showCart" />
    <NavProgress />
    <main
      class="app-main"
      :class="{
        'app-main--admin': isAdminRoute,
        'app-main--home': isHomeRoute
      }"
    >
      <div class="app-main__inner">
        <RouteTransition />
      </div>
    </main>
    <SiteFooter v-if="showSocialFooter" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import CartDrawer from './components/cart/CartDrawer.vue';
import SiteHeader from './components/layout/SiteHeader.vue';
import SiteFooter from './components/layout/SiteFooter.vue';
import NavProgress from './components/loading/NavProgress.vue';
import RouteTransition from './components/loading/RouteTransition.vue';
import { useCart } from './composables/useCart.js';
import { useMobileNav } from './composables/useMobileNav.js';
import { hydrateCartFromServer } from './utils/cart.js';
import { ensureStorefrontNavLoaded } from './composables/useStorefrontNav.js';
import { useStorefrontLabels } from './composables/useStorefrontLabels.js';
import { ensureSiteBrandLoaded } from './composables/useSiteBrand.js';

const route = useRoute();
const { showCart } = useStorefrontLabels();
const { drawerOpen } = useCart();
const { mobileMenuOpen, closeMobileMenu } = useMobileNav();
const siteHeaderRef = ref(null);

const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const isHomeRoute = computed(() => route.name === 'home');
const isGalleryProductOpen = computed(
  () =>
    (route.name === 'wanna-dos' &&
      typeof route.query.product === 'string' &&
      Boolean(route.query.product)) ||
    (route.name === 'gallery' &&
      typeof route.query.work === 'string' &&
      Boolean(route.query.work))
);
const hideHeaderForGalleryProduct = computed(() => isGalleryProductOpen.value);

function onEscape(event) {
  if (event.key === 'Escape' && mobileMenuOpen.value) {
    closeMobileMenu();
  }
}

function syncBodyHeaderClasses() {
  document.body.classList.toggle('mobile-menu-open', mobileMenuOpen.value);
  document.body.classList.toggle('cart-open', drawerOpen.value);
}

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
    siteHeaderRef.value?.resetHeader();
    nextTick(() => siteHeaderRef.value?.syncSiteHeaderOffset());
  }
);

watch([mobileMenuOpen, drawerOpen], () => {
  syncBodyHeaderClasses();
  siteHeaderRef.value?.resetHeader();
});

onMounted(() => {
  hydrateCartFromServer();
  ensureStorefrontNavLoaded();
  ensureSiteBrandLoaded();
  window.addEventListener('keydown', onEscape);
  syncBodyHeaderClasses();
});

onUnmounted(() => {
  window.removeEventListener('keydown', onEscape);
  document.body.classList.remove('mobile-menu-open', 'cart-open');
});

const showSocialFooter = computed(() => {
  const name = route.name;
  return name === 'home' || name === 'gallery' || name === 'wanna-dos' || name === 'contact' || name === 'book-appointment';
});
</script>

<style>
.app-main {
  flex: 1;
  padding: calc(var(--site-header-height, 76px) + var(--space-xl)) var(--space-lg) var(--space-3xl);
}

.app-main--admin {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.app-main--admin:has(.admin-shell) {
  overflow: hidden;
}

.app-main--admin .app-main__inner {
  max-width: none;
  margin: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.app-main--admin:has(.admin-shell) .app-main__inner {
  flex: 1;
  min-height: 0;
  height: auto;
  overflow: hidden;
}

.app-main__inner {
  max-width: var(--max-width-page);
  margin: 0 auto;
}

.app-main--home {
  padding: 0;
  padding-top: var(--site-header-height, 76px);
}

.app-main--home .app-main__inner {
  max-width: none;
  width: 100%;
  margin: 0;
}

.app {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.app:has(.admin-shell) {
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  min-height: 0;
  overflow: hidden;
}

#app:has(.admin-shell) {
  height: 100dvh;
  max-height: 100dvh;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .app-main--product-mobile {
    padding: 0;
    overflow-x: hidden;
  }

  .app-main:not(.app-main--admin) {
    padding: calc(var(--site-header-height, 72px) + var(--space-lg)) var(--mobile-safe-inset-x)
      var(--space-lg);
  }

  .app-main.app-main--home {
    padding-left: 0;
    padding-right: 0;
    padding-bottom: 0;
    padding-top: var(--site-header-height, 72px);
  }

  .app-main--admin {
    padding: 0;
  }
}
</style>
