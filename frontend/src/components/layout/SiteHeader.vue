<template>
  <header
    ref="headerRef"
    class="app-header site-header"
    :class="{
      'is-gallery-hidden': hideForGalleryProduct,
      'site-header--menu-open': mobileMenuOpen
    }"
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
      <SiteBrandMark
        to="/"
        variant="header"
        class="app-brand"
        :aria-label="brandHomeAriaLabel"
        @click="goToLanding"
      />
      <nav class="app-nav app-nav--desktop" aria-label="Main">
        <StorefrontSectionNav
          link-class="app-nav__link"
          active-class="app-nav__link--active"
        />
      </nav>
      <div v-if="showCart" class="app-header__end">
        <CartIcon />
      </div>
    </div>
    <MobileMenuDrawer class="app-header__mobile-nav" />
  </header>
</template>

<script setup>
import { ref, watch } from 'vue';
import CartIcon from '../cart/CartIcon.vue';
import MobileMenuDrawer from '../mobile/MobileMenuDrawer.vue';
import SiteBrandMark from '../brand/SiteBrandMark.vue';
import { useCart } from '../../composables/useCart.js';
import { useMobileNav } from '../../composables/useMobileNav.js';
import { useSiteHeaderScroll } from '../../composables/useSiteHeaderScroll.js';
import { useStorefrontLabels } from '../../composables/useStorefrontLabels.js';
import { useSiteBrand } from '../../composables/useSiteBrand.js';
import StorefrontSectionNav from './StorefrontSectionNav.vue';
import { useStorefrontSectionNav } from '../../composables/useStorefrontSectionNav.js';

defineProps({
  hideForGalleryProduct: {
    type: Boolean,
    default: false
  }
});

const { brandHomeAriaLabel } = useSiteBrand();
const { showCart } = useStorefrontLabels();
const { drawerOpen } = useCart();
const { mobileMenuOpen, toggleMobileMenu } = useMobileNav();
const { goToLanding } = useStorefrontSectionNav();

const headerRef = ref(null);
const headerBarRef = ref(null);

const { resetHeader, syncSiteHeaderOffset, syncHeader } = useSiteHeaderScroll({
  isActive: () => true,
  isScrollLocked: () => mobileMenuOpen.value || drawerOpen.value,
  headerRef,
  headerBarRef
});

watch([mobileMenuOpen, drawerOpen], () => {
  syncHeader();
});

defineExpose({
  resetHeader,
  syncSiteHeaderOffset
});
</script>
