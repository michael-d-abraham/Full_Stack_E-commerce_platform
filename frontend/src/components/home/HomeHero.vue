<template>
  <section class="home-hero" aria-label="Hero">
    <div class="home-hero__stage">
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

    <button
      type="button"
      class="home-hero__scroll"
      aria-label="Scroll to continue"
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

const props = defineProps({
  quote: { type: String, default: '' },
  title: { type: String, default: '' }
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
    const withPeriod = /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
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
  const next = document.getElementById('home-featured')
    || document.querySelector('.home-featured, .home-about');
  if (!next) {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    return;
  }

  // Align section flush to the top of the viewport (ignore scroll-padding so the
  // hero arrow is fully off-screen). Header auto-hides on downward scroll.
  const top = Math.round(next.getBoundingClientRect().top + window.scrollY);
  window.scrollTo({ top, behavior: 'smooth' });
}
</script>

<style scoped>
.home-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 78svh;
  padding: clamp(2.5rem, 6vh, 4rem) clamp(1.25rem, 4vw, 2.5rem) clamp(2.5rem, 6vh, 4rem);
  box-sizing: border-box;
  background: #ffffff;
  color: #000000;
  overflow: hidden;
}

.home-hero__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: min(100%, 56rem);
  flex: 1 1 auto;
  text-align: center;
  animation: home-hero-enter 0.9s ease-out both;
}

.home-hero__quote {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2.75rem, 7vh, 5rem);
  margin: 0;
  padding: 0;
  border: none;
  max-width: 100%;
  width: 100%;
}

.home-hero__phrase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.12em;
  margin: 0;
  padding: 0;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(2.75rem, 7.5vw, 6.5rem);
  font-weight: 300;
  line-height: 1.12;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: #000000;
  quotes: none;
}

.home-hero__phrase-line {
  display: block;
  max-width: 100%;
}

.home-hero__signature {
  margin: clamp(1.25rem, 2.5vh, 2rem) 0 0;
  padding: 0;
  font-family: var(--font-script);
  font-size: clamp(1.25rem, 2.2vw, 1.75rem);
  font-weight: 400;
  font-style: normal;
  line-height: 1.3;
  letter-spacing: 0.01em;
  color: #000000;
  opacity: 0.72;
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
  .home-hero__stage {
    animation: none;
  }

  .home-hero__scroll,
  .home-hero__scroll:hover,
  .home-hero__scroll:active {
    transition: none;
    transform: translateX(-50%);
  }
}

@media (max-width: 640px) {
  .home-hero {
    min-height: calc(100svh - var(--site-header-height, 72px));
    padding: 1.5rem 1.125rem 5.5rem;
  }

  .home-hero__quote {
    gap: clamp(2.25rem, 6.5vh, 3.5rem);
  }

  .home-hero__phrase {
    font-size: clamp(2.15rem, 10.5vw, 3.25rem);
    line-height: 1.14;
    letter-spacing: 0.06em;
  }

  .home-hero__signature {
    margin-top: 1.25rem;
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
    border: 1px solid #c8c8c8;
    border-radius: 50%;
    background: transparent;
    color: #666666;
    box-shadow: none;
    cursor: pointer;
    transition: border-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
  }

  .home-hero__scroll:hover,
  .home-hero__scroll:active {
    border-color: #000000;
    color: #000000;
    background: transparent;
    transform: translateX(-50%) translateY(2px);
  }

  .home-hero__scroll:focus-visible {
    outline: none;
    box-shadow: 0 0 0 1px #000000;
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
