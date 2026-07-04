<template>
  <div class="app">
    <header
      v-if="!isAdminRoute"
      class="app-header site-header"
      :class="headerHidden ? 'is-hidden' : 'is-visible'"
    >
      <div ref="headerBarRef" class="app-header__bar">
        <button
          type="button"
          class="mobile-menu-toggle"
          :aria-label="mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :aria-expanded="mobileMenuOpen"
          @click="toggleMobileMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <SiteBrandMark to="/" variant="header" class="app-brand" :aria-label="brandHomeAriaLabel" />
        <nav class="app-nav app-nav--desktop" aria-label="Main">
          <router-link to="/" class="app-nav__link" exact-active-class="app-nav__link--active">
            Home
          </router-link>
          <router-link to="/gallery" class="app-nav__link" active-class="app-nav__link--active">
            Gallery
          </router-link>
          <router-link
            v-if="showContactNav"
            to="/contact"
            class="app-nav__link"
            active-class="app-nav__link--active"
          >
            Contact
          </router-link>
          <router-link
            v-if="showBookNav"
            to="/book"
            class="app-nav__link"
            active-class="app-nav__link--active"
          >
            Book
          </router-link>
        </nav>
        <div class="app-header__end">
          <CartIcon />
        </div>
      </div>
      <MobileMenuDrawer class="app-header__mobile-nav" />
    </header>
    <CartDrawer v-if="!isAdminRoute" />
    <main
      class="app-main"
      :class="{
        'app-main--product-mobile': isProductMobile,
        'app-main--admin': isAdminRoute,
        'app-main--home': isHomeRoute
      }"
    >
      <div class="app-main__inner">
        <router-view />
      </div>
    </main>
    <SiteFooter v-if="showSocialFooter" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import CartIcon from './components/cart/CartIcon.vue';
import CartDrawer from './components/cart/CartDrawer.vue';
import MobileMenuDrawer from './components/mobile/MobileMenuDrawer.vue';
import SiteFooter from './components/layout/SiteFooter.vue';
import SiteBrandMark from './components/brand/SiteBrandMark.vue';
import { useCart } from './composables/useCart.js';
import { useMobileNav } from './composables/useMobileNav.js';
import { useMediaQuery } from './composables/useMediaQuery.js';
import { useAutoHideSiteHeader } from './composables/useAutoHideSiteHeader.js';
import { hydrateCartFromServer } from './utils/cart.js';
import { ensureStorefrontNavLoaded, showContactNav, showBookNav } from './composables/useStorefrontNav.js';
import { ensureSiteBrandLoaded, useSiteBrand } from './composables/useSiteBrand.js';

const MOBILE_LAYOUT_MQ = '(max-width: 640px)';

const route = useRoute();
const { brandHomeAriaLabel } = useSiteBrand();
const { drawerOpen } = useCart();
const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileNav();
const isMobile = useMediaQuery(MOBILE_LAYOUT_MQ);
const headerBarRef = ref(null);

const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const isHomeRoute = computed(() => route.name === 'home');
const isGalleryProductOpen = computed(
  () => route.name === 'gallery' && typeof route.query.product === 'string' && Boolean(route.query.product)
);
const isProductMobile = computed(
  () => isMobile.value && (route.name === 'product-detail' || isGalleryProductOpen.value)
);

const { headerHidden, resetHeader, syncSiteHeaderOffset } = useAutoHideSiteHeader({
  isActive: () => !isAdminRoute.value,
  isScrollLocked: () => mobileMenuOpen.value || drawerOpen.value,
  headerBarRef
});

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
    resetHeader();
    nextTick(() => syncSiteHeaderOffset());
  }
);

watch([mobileMenuOpen, drawerOpen], () => {
  syncBodyHeaderClasses();
  resetHeader();
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
  return name === 'home' || name === 'gallery' || name === 'contact' || name === 'product-detail' || name === 'book-appointment';
});
</script>

<style>
.app-header {
  z-index: 1000;
}

.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transform: translateY(0);
  will-change: transform;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.04),
    0 6px 20px -6px rgba(0, 0, 0, 0.1);
  transition:
    transform 960ms cubic-bezier(0.18, 1, 0.22, 1),
    box-shadow 960ms ease,
    border-color 960ms ease;
}

.site-header.is-hidden {
  transform: translateY(-110%);
  pointer-events: none;
}

.site-header.is-visible {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .site-header {
    transition: none;
  }
}

.app-header__bar {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 1.25rem var(--header-padding-x) 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}

.app-brand {
  text-decoration: none;
  color: var(--color-text);
  line-height: 1;
  flex-shrink: 0;
}

.app-brand.site-brand-mark--image {
  letter-spacing: 0;
  text-transform: none;
}

.app-brand:hover,
.app-brand:active,
.app-brand:focus-visible {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .app-brand:hover {
    opacity: 0.85;
  }
}

.app-header__end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-lg);
  margin-left: auto;
  margin-right: var(--space-xl);
}

@media (min-width: 641px) {
  .app-header__mobile-nav {
    display: none !important;
  }
}

.mobile-menu-toggle {
  display: none;
  box-shadow: none;
  letter-spacing: 0;
  text-transform: none;
  border-radius: 0;
}

.mobile-menu-toggle:hover:not(:disabled) {
  background: transparent;
  border-color: transparent;
  opacity: 1;
}

.mobile-menu-toggle:focus-visible {
  box-shadow: var(--focus-ring);
}

.app-nav__link {
  color: var(--color-text);
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.app-nav__link:hover {
  opacity: 0.5;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.app-nav__link.router-link-active,
.app-nav__link.router-link-exact-active,
.app-nav__link.app-nav__link--active {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

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

@media (max-width: 640px) {
  .app-header__bar {
    padding: 1rem var(--mobile-safe-inset-x);
    gap: 0;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    position: relative;
  }

  .mobile-menu-toggle {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
    z-index: 2;
  }

  .app-brand {
    grid-column: 2;
    grid-row: 1;
    justify-self: center;
    max-width: 100%;
    min-width: 0;
    text-align: center;
  }

  .app-header__end {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
    justify-content: flex-end;
    gap: 0;
    z-index: 2;
  }

  .app-nav--desktop {
    display: none;
  }

  .app-main--product-mobile {
    padding: 0;
    overflow-x: hidden;
  }

  .mobile-menu-toggle {
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
  }

  .mobile-menu-toggle span {
    width: 22px;
    height: 2px;
    background: #000;
    display: block;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .mobile-menu-toggle[aria-expanded='true'] span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .mobile-menu-toggle[aria-expanded='true'] span:nth-child(2) {
    opacity: 0;
  }

  .mobile-menu-toggle[aria-expanded='true'] span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  .app-main:not(.app-main--admin) {
    /* Fixed header is out of flow — offset top padding by measured bar height */
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

@media (max-width: 390px) {
  .app-header__bar {
    padding-left: var(--mobile-safe-inset-x);
    padding-right: var(--mobile-safe-inset-x);
  }

  .app-brand {
    font-size: 1.25rem;
    letter-spacing: 0.1em;
  }

  .app-nav--desktop .app-nav__link {
    font-size: 0.8125rem;
    letter-spacing: 0.08em;
  }

}
</style>
