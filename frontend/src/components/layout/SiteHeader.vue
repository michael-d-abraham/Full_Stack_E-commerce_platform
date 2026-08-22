<template>
  <header
    ref="headerRef"
    class="app-header site-header"
    :class="{
      'is-gallery-hidden': hideForGalleryProduct
    }"
  >
    <div ref="headerBarRef" class="app-header__bar">
      <nav class="app-nav" aria-label="Main">
        <StorefrontSectionNav
          link-class="app-nav__link"
          active-class="app-nav__link--active"
        />
      </nav>
      <div v-if="showCart" class="app-header__end">
        <CartIcon />
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue';
import CartIcon from '../cart/CartIcon.vue';
import { useCart } from '../../composables/useCart.js';
import { useSiteHeaderScroll } from '../../composables/useSiteHeaderScroll.js';
import { useStorefrontLabels } from '../../composables/useStorefrontLabels.js';
import StorefrontSectionNav from './StorefrontSectionNav.vue';

defineProps({
  hideForGalleryProduct: {
    type: Boolean,
    default: false
  }
});

const { showCart } = useStorefrontLabels();
const { drawerOpen } = useCart();

const headerRef = ref(null);
const headerBarRef = ref(null);

const { resetHeader, syncSiteHeaderOffset, syncHeader } = useSiteHeaderScroll({
  isActive: () => true,
  isScrollLocked: () => drawerOpen.value,
  headerRef,
  headerBarRef
});

watch(drawerOpen, () => {
  syncHeader();
});

defineExpose({
  resetHeader,
  syncSiteHeaderOffset
});
</script>
