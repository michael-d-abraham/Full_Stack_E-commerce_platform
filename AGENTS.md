# Agent notes

Project conventions and pitfalls learned from prior sessions. Cursor rules in [`.cursor/rules/`](.cursor/rules/) apply automatically when matching files are open.

---

## Storefront scroll-progress header

**Breakpoint:** desktop nav vs mobile hamburger at **768px** (`769px` media queries). Product UI uses 640px separately.

**Key files**

| Area | Files |
|------|--------|
| Header component | `frontend/src/components/layout/SiteHeader.vue` |
| Scroll composable | `frontend/src/composables/useSiteHeaderScroll.js` |
| Header CSS | `frontend/src/styles/site-header.css` |
| Design tokens | `frontend/src/styles/base.css` (`--nav-*`, `--site-header-*`) |
| Mobile drawer | `frontend/src/components/mobile/MobileMenuDrawer.vue` |
| App wiring | `frontend/src/App.vue` (`<SiteHeader ref="siteHeaderRef" />`) |

**Architecture:** `base.css` tokens → `site-header.css` → `SiteHeader.vue` → `App.vue`. Do not put header styles back in `App.vue`.

**Scroll progress:** JS sets `--nav-scroll` (0–1) directly on `<header class="site-header">` via rAF + passive scroll listener — **no reactive Vue ref** for progress. CSS interpolates surface only.

```js
progress = clamp(scrollY / --nav-scroll-distance, 0, 1)  // 120px mobile, 160px desktop
```

**At top (`--nav-scroll: 0`):** centered pill shell (same width as scrolled), transparent, no glass/shadow.

**Scrolled (`--nav-scroll: 1`):** same shell dimensions; adds float offset, frosted `::before` glass, border, shadow. Menu/cart open forces `1`.

**Critical — constant dimensions:** Shell width (`calc(100% - 2 * var(--nav-inset-x))`), centering (`left: 50%; transform: translateX(-50%)`), bar height, bar padding, and logo size must **not** interpolate with `--nav-scroll`. Only animate top offset, glass, border, and shadow. Interpolating shell width causes logo/nav to slide horizontally (common bug).

**Content offset:** `--site-header-height` on `<html>` uses compact bar height; `ResizeObserver` in composable. Pinned so main padding does not jump mid-scroll.

**Gallery overlay:** `hideForGalleryProduct` → `.is-gallery-hidden`. Gallery open uses `body.gallery-product-open`.

See [.cursor/rules/site-header.mdc](.cursor/rules/site-header.mdc) for full conventions.

---

## Mobile product UI (≤640px)

**Breakpoint:** `useMediaQuery('(max-width: 640px)')` — used across product pages, overlays, and gallery.

**Key files**

| Area | Files |
|------|--------|
| Product page / overlay | `frontend/src/pages/ProductDetail.vue`, `ProductDetailOverlay.vue` |
| Image gallery + lightbox | `ProductImageGallery.vue`, `MobileFullscreenImageViewer.vue` |
| Circle button base | `ProductFloatingCircleButton.vue`, `productCircleIcons.js` |
| Thin wrappers | `ProductCloseButton.vue`, `ProductGalleryNavButton.vue` |

**Mobile gallery flow:** `ProductImageGallery` renders the stage with nav + expand. On mobile, opening lightbox teleports to `MobileFullscreenImageViewer` (fullscreen dark overlay) unless `containedLightbox` is active (desktop card lightbox).

When doing **visual-only refactors** on product mobile UI, do not change routing, swipe handlers, lightbox open/close logic, cart behavior, or gallery index state unless explicitly asked.

---

## Mobile floating circle buttons

When adding or changing **circular icon controls on mobile product screens** (close, nav chevrons, expand, etc.):

- **Always start from** `frontend/src/components/product/ProductFloatingCircleButton.vue`
- **Do not** duplicate frosted styling, shadows, focus behavior, or one-off circle buttons
- **Extend** via thin wrappers, new `icon` entries in `productCircleIcons.js`, or new `placement` modifiers on the base component
- **Unify visual style, not necessarily size** — same frosted background, shadow, icon stroke, hover, and active scale; close buttons stay `lg`, nav/expand stay `md`

See [.cursor/rules/mobile-floating-circle-buttons.mdc](.cursor/rules/mobile-floating-circle-buttons.mdc) for full conventions.

**Quick reference**

| Control | Wrapper / usage | Mobile `size` | Placement |
|---------|-----------------|---------------|-----------|
| Close (overlay) | `ProductCloseButton` `placement="overlay"` | `lg` | maps to `overlay-close` |
| Close (fullscreen viewer) | `ProductCloseButton` `placement="fullscreen"` | `lg` | maps to `mobile-viewer-close` |
| Close (inline / router-link) | `ProductCloseButton` | `lg` | `inline` + optional `to` |
| Prev / next | `ProductGalleryNavButton` | `md` | `overlay-prev/next` or `lightbox-prev/next` |
| Expand | `ProductFloatingCircleButton` directly | `md` | `stage-enlarge` |

**Desktop:** product close keeps solid-white circle styles. Gate mobile delegation in wrappers with `useMediaQuery`; do not change desktop appearance unless asked.

---

## Pitfalls (learned the hard way)

### 1. Black outline on refresh / focus

`ProductDetailOverlay` auto-focuses `.product-close-button` when the overlay opens. Global `button:focus-visible` in `base.css` applies `--focus-ring` (1px solid black).

**Never** use `box-shadow: var(--focus-ring)` on circle buttons. Focus states must keep the normal frosted shadow. Overrides exist in `base.css` for `.product-floating-circle-button` and in the component itself.

### 2. Global `button` resets

`base.css` gives all `<button>` elements a black border, padding, and focus ring. Circle buttons must set `border: none`, `padding: 0`, and override focus styles. Scoped component CSS alone may not win against global rules — add global exceptions in `base.css` when needed.

### 3. Swipe vs tap on gallery

`ProductImageGallery` and `MobileFullscreenImageViewer` use `CONTROL_SELECTOR` so touches on controls are not treated as swipes or backdrop taps. When adding a new floating control, include it in the selector:

```
.product-floating-circle-button, .product-close-button, .product-image-gallery__enlarge, ...
```

### 4. Keep `.product-close-button` class on mobile close

Overlay focus management queries `.product-close-button`. Mobile close still renders via `ProductFloatingCircleButton` but must retain the `product-close-button` class for focus restore and parent `:deep()` margin rules.

### 5. Wrapper CSS must exclude the base

`ProductCloseButton` desktop styles use `:not(.product-floating-circle-button)` so solid-white desktop rules do not bleed onto the mobile frosted base.

### 6. Placement lives on the base, not consumers

Positioning for overlay close, fullscreen close, nav sides, and expand bottom-right are `placement` modifiers on `ProductFloatingCircleButton`. Do not re-position from `ProductDetail.vue` or gallery parents with one-off overrides.

### 7. Layout CSS variables

`ProductFloatingCircleButton--lg` sets `--product-close-circle-size: 48px`. `MobileFullscreenImageViewer` uses this to offset the image viewport below the close button — do not remove without checking viewer layout.

### 8. New icons workflow

1. Add path data to `productCircleIcons.js`
2. Extend `icon` prop validator on `ProductFloatingCircleButton`
3. Use via wrapper or direct — do not inline duplicate SVGs in consumers

---

## Vue / CSS conventions for this codebase

- **Frontend:** Vue 3 SFCs, composables in `frontend/src/composables/`
- **Scoped styles:** prefer extending the shared base over copying CSS blocks
- **Accessibility:** every circle control needs a descriptive `aria-label`; icons are `aria-hidden`
- **Touch:** `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` are on the base component — do not strip them
