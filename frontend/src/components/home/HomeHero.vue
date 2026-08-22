<template>
  <section
    :id="sectionId"
    class="home-hero"
    :class="{ 'home-hero--reversed': reversed }"
    :aria-label="reversed ? 'hero continued' : 'hero'"
  >
    <div class="home-hero__grid">
      <div class="home-hero__copy">
        <blockquote v-if="quotePhrases.length" class="home-hero__quote">
          <p
            v-for="(phrase, index) in quotePhrases"
            :key="`hero-phrase-${index}`"
            class="home-hero__phrase"
          >
            <span
              v-for="(line, lineIndex) in phrase.lines"
              :key="`hero-phrase-${index}-line-${lineIndex}`"
              class="home-hero__phrase-line"
            >{{ line }}</span>
          </p>
        </blockquote>

        <p v-if="signature" class="home-hero__signature">{{ signature }}</p>
      </div>

      <figure class="home-hero__media">
        <SmartImage
          v-if="imageUrl"
          :src="imageUrl"
          alt="hero portrait"
          layout="fill"
          object-fit="contain"
          :width="1200"
          :widths="IMAGE_WIDTHS"
          :sizes="IMAGE_SIZES"
          :priority="true"
        />
      </figure>
    </div>

    <button
      v-if="!reversed"
      type="button"
      class="home-hero__scroll"
      aria-label="scroll to continue"
      @click="scrollToNext"
    >
      <svg class="home-hero__scroll-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import SmartImage from '../media/SmartImage.vue';

const IMAGE_WIDTHS = [480, 720, 960, 1200];
const IMAGE_SIZES = '(max-width: 768px) 100vw, 50vw';

const props = defineProps({
  quote: { type: String, default: '' },
  title: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  reversed: { type: Boolean, default: false },
  sectionId: { type: String, default: 'landing' }
});

/**
 * Split a hero quote into distinct statements with intentional line breaks.
 * Sentences become separate phrases; a natural mid-phrase break creates two lines.
 */
function buildQuotePhrases(rawQuote) {
  const raw = String(rawQuote || '')
    .replace(/^[\s"'“”]+|[\s"'“”]+$/g, '')
    .trim();

  if (!raw) {
    return [];
  }

  const sentences = raw
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const parts = sentences.length > 1 ? sentences : [raw];

  return parts.map((sentence) => {
    const cleaned = sentence.replace(/\s+/g, ' ').trim();
    const withPeriod =
      /[.!?]$/.test(cleaned) || !cleaned.includes(' ') ? cleaned : `${cleaned}.`;
    return {
      lines: breakPhraseIntoLines(withPeriod)
    };
  });
}

function breakPhraseIntoLines(phrase) {
  const match = phrase.match(/^(.*?)\bwe\b\s+(.+)$/i);
  if (match) {
    const first = `${match[1]}we`.replace(/\s+/g, ' ').trim();
    const second = match[2].replace(/\s+/g, ' ').trim();
    return [first, second];
  }

  const words = phrase.split(/\s+/);
  if (words.length >= 6) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }

  return [phrase];
}

const quotePhrases = computed(() => buildQuotePhrases(props.quote));
const signature = computed(() => props.title.trim());

function scrollToNext() {
  const next = document.querySelector('.home-about-me, .home-testimonials');
  if (!next) {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    return;
  }

  const top = Math.round(next.getBoundingClientRect().top + window.scrollY);
  window.scrollTo({ top, behavior: 'smooth' });
}
</script>

<style scoped>
.home-hero {
  --home-hero-height: calc(100svh - var(--site-header-height, 52px));
  --home-hero-height: calc(100dvh - var(--site-header-height, 52px));
  position: relative;
  width: 100%;
  height: var(--home-hero-height);
  min-height: var(--home-hero-height);
  max-height: var(--home-hero-height);
  padding: 0;
  box-sizing: border-box;
  background: var(--color-bg);
  color: var(--color-text);
  overflow: hidden;
}

.home-hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  width: 100%;
  height: 100%;
}

.home-hero--reversed .home-hero__media {
  order: -1;
}

.home-hero__copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: clamp(1.25rem, 2.5vh, 2rem);
  padding: clamp(2.5rem, 6vh, 4rem) clamp(1.5rem, 4vw, 3.5rem);
  box-sizing: border-box;
  text-align: center;
  animation: home-hero-enter 0.9s ease-out both;
}

.home-hero__quote {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1.75rem, 4.5vh, 3.25rem);
  margin: 0 auto;
  padding: 0;
  border: none;
  width: max-content;
  max-width: 100%;
}

.home-hero__phrase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.12em;
  margin: 0;
  padding: 0 0 0 0.08em;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(1.85rem, 3.6vw, 3.75rem);
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: lowercase;
  color: var(--color-text);
  quotes: none;
}

.home-hero__phrase-line {
  display: block;
  width: max-content;
  max-width: 100%;
  margin-inline: auto;
  text-align: center;
}

.home-hero__signature {
  margin: 0;
  padding: 0;
  font-family: var(--font-script);
  font-size: clamp(1.15rem, 1.8vw, 1.6rem);
  font-weight: 400;
  font-style: normal;
  line-height: 1.3;
  letter-spacing: 0.01em;
  color: var(--color-text);
  opacity: 0.72;
}

.home-hero__media {
  position: relative;
  margin: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--color-highlight);
}

.home-hero__media :deep(.smart-image.smart-image--fill) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.home-hero__scroll {
  display: none;
}

@keyframes home-hero-enter {
  from {
    opacity: 0;
    transform: translateY(0.6rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hero__copy {
    animation: none;
  }

  .home-hero__scroll,
  .home-hero__scroll:hover,
  .home-hero__scroll:active {
    transition: none;
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .home-hero {
    --home-hero-height: calc(100svh - var(--site-header-height, 52px));
    height: auto;
    min-height: var(--home-hero-height);
    max-height: none;
  }

  .home-hero__grid {
    grid-template-columns: 1fr;
    height: auto;
    min-height: var(--home-hero-height);
  }

  .home-hero__copy {
    padding: 1.5rem 1.125rem 1.75rem;
  }

  .home-hero__quote {
    gap: clamp(1.5rem, 4vh, 2.25rem);
  }

  .home-hero__phrase {
    font-size: clamp(1.85rem, 8.5vw, 2.75rem);
    line-height: 1.14;
    letter-spacing: 0.06em;
  }

  .home-hero__media {
    height: min(72svh, 36rem);
    min-height: 22rem;
  }

  .home-hero__scroll {
    display: inline-flex;
    position: absolute;
    left: 50%;
    bottom: max(1.25rem, env(safe-area-inset-bottom, 0px) + 1rem);
    transform: translateX(-50%);
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    margin: 0;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-muted);
    box-shadow: none;
    cursor: pointer;
    transition: border-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
  }

  .home-hero__scroll:hover,
  .home-hero__scroll:active {
    border-color: var(--color-text);
    color: var(--color-text);
    background: transparent;
    transform: translateX(-50%) translateY(2px);
  }

  .home-hero__scroll:focus-visible {
    outline: none;
    box-shadow: 0 0 0 1px var(--color-text);
  }

  .home-hero__scroll-icon {
    display: block;
    width: 0.95rem;
    height: 0.95rem;
  }

  .home-hero__scroll-icon path {
    stroke-width: 1.35;
  }
}
</style>
