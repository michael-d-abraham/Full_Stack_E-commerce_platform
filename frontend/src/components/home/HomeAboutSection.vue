<template>
  <section
    id="about"
    class="home-about home-section"
    :class="{ 'home-section--has-background': Boolean(backgroundImageUrl) }"
    aria-labelledby="home-about-heading"
  >
    <div
      v-if="backgroundImageUrl"
      class="home-about__background home-section__background"
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
        <div class="home-about__copy-col">
          <blockquote v-if="header" class="home-about__quote home-quote">
            {{ formattedQuote }}
          </blockquote>

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

        <figure v-if="imageUrl" class="home-about__media">
          <img
            class="home-about__image"
            :src="imageUrl"
            :alt="portraitAlt"
          />
        </figure>
        <div v-else class="home-about__media home-about__media--empty" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';

const STATEMENT_PREVIEW_CHARS = 320;
const STATEMENT_MIN_SENTENCE_CHARS = 100;

const props = defineProps({
  sectionTitle: { type: String, required: true },
  header: { type: String, default: '' },
  text: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  backgroundImageUrl: { type: String, default: '' }
});

const expanded = ref(false);

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

const portraitAlt = computed(() => {
  const name = props.sectionTitle.trim();
  return name ? `Portrait of ${name}` : 'Artist portrait';
});

const isTruncatable = computed(
  () => props.text.trim().length > STATEMENT_PREVIEW_CHARS
);

const visibleStatement = computed(() => {
  const body = props.text.trim();

  if (!body || expanded.value || body.length <= STATEMENT_PREVIEW_CHARS) {
    return body;
  }

  const slice = body.slice(0, STATEMENT_PREVIEW_CHARS);
  const lastSentenceEnd = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));

  if (lastSentenceEnd > STATEMENT_MIN_SENTENCE_CHARS) {
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
  background: var(--color-bg);
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
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(0.9375rem, 2vw, 1.25rem);
  font-weight: 300;
  letter-spacing: 0.22em;
  text-transform: lowercase;
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
  grid-template-areas: 'copy portrait';
  column-gap: clamp(var(--space-xl), 4vw, var(--space-2xl));
  row-gap: 0;
  align-items: start;
}

.home-about__copy-col {
  grid-area: copy;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-sm);
  min-width: 0;
}

.home-about__quote {
  margin: 0;
  max-width: 100%;
}

@media (min-width: 641px) {
  .home-about__grid {
    position: relative;
  }

  .home-about__copy-col {
    gap: 0.65rem;
    position: relative;
    z-index: 2;
  }

  .home-about__quote {
    position: relative;
    z-index: 2;
  }

  .home-about__quote.home-quote::after {
    margin-top: 0.65rem;
  }

  .home-about__media {
    position: relative;
    z-index: 1;
    align-self: start;
  }
}

.home-about__statement {
  max-width: 34rem;
  width: 100%;
}

.home-about__copy {
  margin: 0;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.7;
  letter-spacing: 0.03em;
  color: var(--color-text);
  white-space: pre-line;
}

@media (min-width: 641px) {
  .home-about__copy {
    font-size: 1.125rem;
    line-height: 1.75;
  }
}

.home-about__read-more {
  margin-top: var(--space-md);
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: 0.8125rem;
  font-weight: 300;
  letter-spacing: 0.16em;
  text-transform: lowercase;
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
  margin: 0;
  align-self: start;
  display: flex;
  justify-content: flex-end;
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
      'copy';
    row-gap: var(--space-xl);
    position: relative;
  }

  .home-about__media {
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  .home-about__copy-col {
    gap: var(--space-md);
    position: relative;
    z-index: 2;
  }

  .home-about__quote {
    position: relative;
    z-index: 2;
    margin-top: calc(-1 * var(--space-xl));
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
</style>
