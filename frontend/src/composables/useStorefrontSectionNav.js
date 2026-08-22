import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FOOTER_SECTION_IDS, STOREFRONT_SECTION, storefrontHash } from '../constants/storefrontSections.js';
import { showBookNav, showContactNav } from './useStorefrontNav.js';
import { useStorefrontLabels } from './useStorefrontLabels.js';
import { useMobileNav } from './useMobileNav.js';

const activeSectionId = ref(STOREFRONT_SECTION.landing);
let observer = null;
let observerUsers = 0;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

export function scrollToStorefrontSection(sectionId) {
  if (!sectionId || typeof document === 'undefined') {
    return;
  }

  const behavior = scrollBehavior();

  if (sectionId === STOREFRONT_SECTION.landing) {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  if (FOOTER_SECTION_IDS.has(sectionId)) {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
    return;
  }

  const el = document.getElementById(sectionId);
  if (!el) {
    return;
  }
  el.scrollIntoView({ behavior, block: 'start' });
}

function navItemList(galleryNavLabel, wannaDosNavLabel) {
  const items = [
      { id: STOREFRONT_SECTION.landing, label: 'home' },
      { id: STOREFRONT_SECTION.about, label: 'about' },
      { id: STOREFRONT_SECTION.aboutMe, label: 'about me' },
      { id: STOREFRONT_SECTION.myArt, label: 'my art' },
    { id: STOREFRONT_SECTION.gallery, label: galleryNavLabel },
    { id: STOREFRONT_SECTION.wannaDos, label: wannaDosNavLabel }
  ];
  if (showContactNav.value) {
      items.push({ id: STOREFRONT_SECTION.contact, label: 'contact' });
  }
  if (showBookNav.value) {
      items.push({ id: STOREFRONT_SECTION.book, label: 'book' });
  }
  return items;
}

const IN_PAGE_SECTION_IDS = [
  STOREFRONT_SECTION.landing,
  STOREFRONT_SECTION.about,
  STOREFRONT_SECTION.aboutMe,
  STOREFRONT_SECTION.myArt,
  STOREFRONT_SECTION.gallery,
  STOREFRONT_SECTION.wannaDos
];

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
      if (nearBottom) {
        activeSectionId.value = showContactNav.value
          ? STOREFRONT_SECTION.contact
          : STOREFRONT_SECTION.book;
        return;
      }

      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target?.id) {
        activeSectionId.value = visible[0].target.id;
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
  const { galleryNavLabel, wannaDosNavLabel } = useStorefrontLabels();

  const navItems = computed(() => navItemList(galleryNavLabel, wannaDosNavLabel));

  function setActiveFromHash() {
    const id = String(route.hash || '').replace(/^#/, '');
    if (id && navItems.value.some((item) => item.id === id)) {
      activeSectionId.value = id;
    }
  }

  async function goToSection(event, sectionId) {
    event?.preventDefault();
    closeMobileMenu();

    if (route.name !== 'home') {
      await router.push({ name: 'home', hash: storefrontHash(sectionId) });
      return;
    }

    if (route.hash !== storefrontHash(sectionId)) {
      await router.replace({ name: 'home', hash: storefrontHash(sectionId) });
    }

    activeSectionId.value = sectionId;
    requestAnimationFrame(() => {
      scrollToStorefrontSection(sectionId);
    });
  }

  function goToLanding(event) {
    return goToSection(event, STOREFRONT_SECTION.landing);
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
