import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  FOOTER_SECTION_IDS,
  STOREFRONT_NAV,
  STOREFRONT_SECTION,
  STOREFRONT_NAV_LABELS,
  resolveStorefrontNavId,
  resolveStorefrontScrollTarget,
  storefrontHash
} from '../constants/storefrontSections.js';
import { showBookNav, showContactNav } from './useStorefrontNav.js';
import { useMobileNav } from './useMobileNav.js';

const activeSectionId = ref(STOREFRONT_NAV.me);
let observer = null;
let observerUsers = 0;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

function showSayHiNav() {
  return showContactNav.value || showBookNav.value;
}

function headerClearance() {
  const header = document.querySelector('.site-header');
  if (!header) {
    return 64;
  }

  const styles = getComputedStyle(header);
  const rect = header.getBoundingClientRect();
  const navScroll = Number.parseFloat(styles.getPropertyValue('--nav-scroll')) || 0;
  const floatTop = Number.parseFloat(styles.getPropertyValue('--nav-float-top')) || 10;
  const remainingFloat = floatTop * (1 - Math.min(1, Math.max(0, navScroll)));

  return Math.ceil(rect.bottom + remainingFloat + 12);
}

function scrollWindowTo(top, behavior) {
  const maxTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  window.scrollTo({ top: Math.min(Math.max(0, top), maxTop), behavior });
}

export function scrollToStorefrontSection(sectionId) {
  if (!sectionId || typeof document === 'undefined') {
    return;
  }

  const behavior = scrollBehavior();
  const target = resolveStorefrontScrollTarget(sectionId);

  if (target === STOREFRONT_NAV.me) {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const clearance = headerClearance();

  if (FOOTER_SECTION_IDS.has(target)) {
    const footer = document.querySelector('.site-footer');
    const sayHi =
      document.getElementById(STOREFRONT_NAV.sayHi) ||
      document.getElementById(STOREFRONT_SECTION.contact) ||
      document.getElementById(STOREFRONT_SECTION.book);
    const content = document.querySelector('.site-content--has-footer');
    const footerIsSticky = footer && getComputedStyle(footer).position === 'sticky';

    if (footerIsSticky && content) {
      scrollWindowTo(content.offsetTop + content.offsetHeight - clearance, behavior);
      return;
    }

    if (sayHi) {
      scrollWindowTo(sayHi.getBoundingClientRect().top + window.scrollY - clearance, behavior);
      return;
    }

    scrollWindowTo(document.documentElement.scrollHeight, behavior);
    return;
  }

  const el = document.getElementById(target);
  if (!el) {
    return;
  }
  scrollWindowTo(el.getBoundingClientRect().top + window.scrollY - clearance, behavior);
}

function navItemList() {
  const items = [
    { id: STOREFRONT_NAV.me, label: STOREFRONT_NAV_LABELS[STOREFRONT_NAV.me] },
    { id: STOREFRONT_NAV.myArt, label: STOREFRONT_NAV_LABELS[STOREFRONT_NAV.myArt] }
  ];
  if (showSayHiNav()) {
    items.push({
      id: STOREFRONT_NAV.sayHi,
      label: STOREFRONT_NAV_LABELS[STOREFRONT_NAV.sayHi]
    });
  }
  return items;
}

const IN_PAGE_SECTION_IDS = [
  STOREFRONT_SECTION.landing,
  STOREFRONT_SECTION.aboutMe,
  STOREFRONT_SECTION.myArt,
  STOREFRONT_SECTION.gallery,
  STOREFRONT_SECTION.wannaDos
];

const ART_PAGE_ROUTE_NAMES = new Set(['gallery', 'wanna-dos']);

export function refreshStorefrontSectionObserver() {
  observeSections(IN_PAGE_SECTION_IDS);
}

function observeSections(ids) {
  observer?.disconnect();
  if (typeof IntersectionObserver === 'undefined') {
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 96;
      if (nearBottom && showSayHiNav()) {
        activeSectionId.value = STOREFRONT_NAV.sayHi;
        return;
      }

      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const navId = resolveStorefrontNavId(visible[0]?.target?.id);
      if (navId) {
        activeSectionId.value = navId;
      }
    },
    {
      rootMargin: '-22% 0px -58% 0px',
      threshold: [0.12, 0.35, 0.6]
    }
  );

  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) {
      observer.observe(el);
    }
  }
}

export function useStorefrontSectionNav() {
  const route = useRoute();
  const router = useRouter();
  const { closeMobileMenu } = useMobileNav();

  const navItems = computed(() => navItemList());

  function setActiveFromHash() {
    if (ART_PAGE_ROUTE_NAMES.has(route.name)) {
      activeSectionId.value = STOREFRONT_NAV.myArt;
      return;
    }

    const id = String(route.hash || '').replace(/^#/, '');
    const navId = resolveStorefrontNavId(id);
    if (navId && navItems.value.some((item) => item.id === navId)) {
      activeSectionId.value = navId;
    }
  }

  async function goToSection(event, sectionId) {
    event?.preventDefault();
    closeMobileMenu();

    const navId = resolveStorefrontNavId(sectionId) || sectionId;

    if (route.name !== 'home') {
      await router.push({ name: 'home', hash: storefrontHash(navId) });
      return;
    }

    if (route.hash !== storefrontHash(navId)) {
      await router.replace({ name: 'home', hash: storefrontHash(navId) });
    }

    activeSectionId.value = navId;
    requestAnimationFrame(() => {
      scrollToStorefrontSection(navId);
    });
  }

  function goToLanding(event) {
    return goToSection(event, STOREFRONT_NAV.me);
  }

  onMounted(() => {
    setActiveFromHash();
    observerUsers += 1;
    if (observerUsers === 1) {
      requestAnimationFrame(() => {
        refreshStorefrontSectionObserver();
      });
    }
  });

  watch(
    () => [route.name, route.hash],
    () => {
      setActiveFromHash();
    }
  );

  onUnmounted(() => {
    observerUsers -= 1;
    if (observerUsers <= 0) {
      observer?.disconnect();
      observer = null;
      observerUsers = 0;
    }
  });

  return {
    navItems,
    activeSectionId,
    goToSection,
    goToLanding
  };
}
