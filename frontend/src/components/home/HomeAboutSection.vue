<template>
  <section
    ref="sectionRef"
    class="home-about home-section"
    :class="{ 'home-section--has-background': Boolean(backgroundImageUrl) }"
    aria-labelledby="home-about-heading"
  >
    <div
      v-if="backgroundImageUrl"
      ref="backgroundRef"
      class="home-about__background home-section__background"
      :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
      aria-hidden="true"
    />
    <div
      v-if="backgroundImageUrl"
      ref="overlayRef"
      class="home-about__background-overlay home-section__background-overlay"
      :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
      aria-hidden="true"
    />
    <div class="home-about__container mobile-safe-container">
      <header class="home-about__masthead">
        <h2 id="home-about-heading" class="home-about__title">
          {{ sectionTitle }}
        </h2>
        <div class="home-about__divider" aria-hidden="true" />
      </header>

      <div class="home-about__grid">
        <blockquote v-if="header" ref="quoteRef" class="home-about__quote home-quote">
          {{ formattedQuote }}
        </blockquote>

        <figure v-if="imageUrl" ref="photoParallaxRef" class="home-about__media">
          <img
            class="home-about__image"
            :src="imageUrl"
            :alt="portraitAlt"
          />
        </figure>
        <div v-else class="home-about__media home-about__media--empty" aria-hidden="true" />

        <div v-if="text" class="home-about__statement">
          <p class="home-about__copy">{{ visibleStatement }}</p>
          <button
            v-if="isTruncatable"
            type="button"
            class="home-about__read-more"
            @click="expanded = !expanded"
          >
            {{ expanded ? 'Read less' : 'Read more' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useMediaQuery } from '../../composables/useMediaQuery.js';
import { useSectionBackgroundParallax } from '../../composables/useSectionBackgroundParallax.js';
import { useScrollParallax } from '../../composables/useScrollParallax.js';

const STATEMENT_PREVIEW_CHARS_MOBILE = 320;
const STATEMENT_PREVIEW_CHARS_DESKTOP = 640;
const STATEMENT_MIN_SENTENCE_CHARS_MOBILE = 100;
const STATEMENT_MIN_SENTENCE_CHARS_DESKTOP = 200;

const props = defineProps({
  sectionTitle: { type: String, required: true },
  header: { type: String, default: '' },
  text: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  backgroundImageUrl: { type: String, default: '' }
});

const sectionRef = ref(null);
const backgroundRef = ref(null);
const overlayRef = ref(null);
const photoParallaxRef = ref(null);
const quoteRef = ref(null);
const expanded = ref(false);
const isDesktop = useMediaQuery('(min-width: 641px)');

const statementPreviewChars = computed(() =>
  isDesktop.value ? STATEMENT_PREVIEW_CHARS_DESKTOP : STATEMENT_PREVIEW_CHARS_MOBILE
);

const statementMinSentenceChars = computed(() =>
  isDesktop.value ? STATEMENT_MIN_SENTENCE_CHARS_DESKTOP : STATEMENT_MIN_SENTENCE_CHARS_MOBILE
);

const hasBackground = computed(() => Boolean(String(props.backgroundImageUrl || '').trim()));
useSectionBackgroundParallax(sectionRef, backgroundRef, hasBackground, overlayRef);

const hasPortrait = computed(() => Boolean(String(props.imageUrl || '').trim()));
useScrollParallax(sectionRef, photoParallaxRef, hasPortrait, {
  desktop: 0.16,
  mobile: 0.11
});

const formattedQuote = computed(() => {
  const raw = props.header.trim();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('"') || raw.startsWith('“')) {
    return raw;
  }
  return `"${raw}"`;
});

const hasQuote = computed(() => Boolean(formattedQuote.value));
useScrollParallax(sectionRef, quoteRef, hasQuote, {
  axis: 'x',
  xMode: 'enter-from-right',
  maxOffset: 160,
  mobileMaxOffset: 80
});

const portraitAlt = computed(() => {
  const name = props.sectionTitle.trim();
  return name ? `Portrait of ${name}` : 'Artist portrait';
});

const isTruncatable = computed(
  () => props.text.trim().length > statementPreviewChars.value
);

const visibleStatement = computed(() => {
  const body = props.text.trim();
  const previewChars = statementPreviewChars.value;
  const minSentenceChars = statementMinSentenceChars.value;

  if (!body || expanded.value || body.length <= previewChars) {
    return body;
  }

  const slice = body.slice(0, previewChars);
  const lastSentenceEnd = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));

  if (lastSentenceEnd > minSentenceChars) {
    return body.slice(0, lastSentenceEnd + 1).trim();
  }

  return `${slice.trimEnd()}…`;
});
</script>

<style scoped>
.home-about {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 0;
  background: #faf8f3;
}

.home-about__container {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--space-xl) 32px var(--space-2xl);
}

.home-about__masthead {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.home-about__title {
  margin: 0 0 var(--space-md);
  font-family: var(--font-sans);
  font-size: clamp(0.9375rem, 2vw, 1.25rem);
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  line-height: 1.35;
  color: var(--color-text);
}

.home-about__divider {
  width: 3.5rem;
  height: 1px;
  margin: 0 auto;
  background: currentColor;
  opacity: 0.28;
}

.home-about__grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  grid-template-areas:
    'quote portrait'
    'statement portrait';
  column-gap: clamp(var(--space-xl), 4vw, var(--space-2xl));
  row-gap: var(--space-lg);
  align-items: start;
}

.home-about__quote {
  grid-area: quote;
}

@media (min-width: 641px) {
  .home-about__grid {
    position: relative;
  }

  .home-about__quote {
    position: relative;
    z-index: 2;
    will-change: transform;
  }

  .home-about__media {
    position: relative;
    z-index: 1;
  }
}

.home-about__statement {
  grid-area: statement;
  max-width: 34rem;
}

.home-about__copy {
  margin: 0;
  font-size: 1rem;
  line-height: 1.65;
  color: var(--color-text);
  white-space: pre-line;
}

.home-about__read-more {
  margin-top: var(--space-md);
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 0.3em;
  cursor: pointer;
}

.home-about__read-more:hover {
  opacity: 0.55;
}

.home-about__media {
  grid-area: portrait;
  grid-row: 1 / -1;
  margin: 0;
  align-self: stretch;
  display: flex;
  justify-content: flex-end;
  will-change: transform;
}

.home-about__image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  object-position: top center;
  box-shadow:
    2px 4px 10px rgba(0, 0, 0, 0.05),
    6px 18px 36px rgba(0, 0, 0, 0.09);
}

.home-about__media--empty {
  min-height: 28rem;
  background: rgba(0, 0, 0, 0.04);
}

@media (min-width: 641px) {
  .home-about__container {
    max-width: none;
  }
}

@media (max-width: 900px) {
  .home-about__grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    column-gap: var(--space-lg);
  }
}

@media (max-width: 640px) {
  .home-about__container {
    padding: var(--space-lg) var(--mobile-safe-inset-x) var(--space-2xl);
  }

  .home-about__masthead {
    margin-bottom: var(--space-lg);
  }

  .home-about__grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'portrait'
      'quote'
      'statement';
    row-gap: var(--space-xl);
    position: relative;
  }

  .home-about__media {
    grid-row: auto;
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  .home-about__quote {
    position: relative;
    z-index: 2;
    margin-top: calc(-1 * var(--space-xl));
    will-change: transform;
  }

  .home-about__image {
    max-width: min(100%, 22rem);
    margin: 0 auto;
  }

  .home-about__media--empty {
    min-height: 18rem;
    max-width: min(100%, 22rem);
    margin: 0 auto;
  }

  .home-about__statement {
    max-width: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-about__media,
  .home-about__quote {
    will-change: auto;
  }
}
</style>
