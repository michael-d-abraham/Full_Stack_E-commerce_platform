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
      <SiteBrandMark to="/" variant="header" class="app-brand" :aria-label="brandHomeAriaLabel" />
      <nav class="app-nav app-nav--desktop" aria-label="Main">
        <router-link to="/" class="app-nav__link" exact-active-class="app-nav__link--active">
          Home
        </router-link>
        <router-link to="/gallery" class="app-nav__link" active-class="app-nav__link--active">
          {{ galleryNavLabel }}
        </router-link>
        <router-link to="/wanna-dos" class="app-nav__link" active-class="app-nav__link--active">
          {{ wannaDosNavLabel }}
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
      <div v-if="showCart" class="app-header__end">
        <CartIcon />
      </div>
    </div>
    <MobileMenuDrawer class="app-header__mobile-nav" />
  </header>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import CartIcon from '../cart/CartIcon.vue';
import MobileMenuDrawer from '../mobile/MobileMenuDrawer.vue';
import SiteBrandMark from '../brand/SiteBrandMark.vue';
import { useCart } from '../../composables/useCart.js';
import { useMobileNav } from '../../composables/useMobileNav.js';
import { useSiteHeaderScroll } from '../../composables/useSiteHeaderScroll.js';
import { showContactNav, showBookNav } from '../../composables/useStorefrontNav.js';
import { useStorefrontLabels } from '../../composables/useStorefrontLabels.js';
import { useSiteBrand } from '../../composables/useSiteBrand.js';

defineProps({
  hideForGalleryProduct: {
    type: Boolean,
    default: false
  }
});

const { brandHomeAriaLabel } = useSiteBrand();
const { galleryNavLabel, wannaDosNavLabel, showCart } = useStorefrontLabels();
const { drawerOpen } = useCart();
const { mobileMenuOpen, toggleMobileMenu } = useMobileNav();

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
