<template>
  <div class="book-cta" :class="{ 'book-cta--footer': footer }">
    <h2 v-if="showTitle" class="book-cta__title">{{ page.page_title }}</h2>
    <div class="book-calendar" role="group" :aria-label="`${monthLabel} calendar`">
      <p class="book-calendar__month">{{ monthLabel }}</p>
      <div class="book-calendar__weekdays" aria-hidden="true">
        <span v-for="day in weekdays" :key="day" class="book-calendar__weekday">{{ day }}</span>
      </div>
      <div class="book-calendar__grid">
        <span
          v-for="(cell, index) in cells"
          :key="`day-${index}`"
          class="book-calendar__day"
          :class="{
            'book-calendar__day--muted': !cell.inMonth,
            'book-calendar__day--today': cell.isToday
          }"
        >
          {{ cell.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useBookPage } from '../../composables/useBookPage.js';

defineProps({
  showTitle: {
    type: Boolean,
    default: true
  },
  footer: {
    type: Boolean,
    default: false
  }
});

const { page, ensureBookPage } = useBookPage();
const weekdays = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
const today = new Date();

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(today)
);

const cells = computed(() => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentDay = today.getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const grid = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    grid.push({
      label: daysInPrevMonth - firstWeekday + index + 1,
      inMonth: false,
      isToday: false
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    grid.push({
      label: day,
      inMonth: true,
      isToday: day === currentDay
    });
  }

  let nextDay = 1;
  while (grid.length % 7 !== 0) {
    grid.push({
      label: nextDay,
      inMonth: false,
      isToday: false
    });
    nextDay += 1;
  }

  return grid;
});

onMounted(() => {
  ensureBookPage();
});
</script>

<style scoped>
.book-cta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-md);
  width: 100%;
  max-width: 20rem;
}

.book-cta--footer {
  max-width: 28rem;
}

.book-cta__title {
  margin: 0;
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: clamp(0.9375rem, 2vw, 1.25rem);
  font-weight: 300;
  line-height: 1.35;
  letter-spacing: 0.22em;
  color: var(--color-text);
}

.book-calendar {
  width: 100%;
  padding: var(--space-md) 0 0;
  background: transparent;
}

.book-calendar__month {
  margin: 0 0 var(--space-md);
  font-family: var(--gallery-meta-font, 'Oswald', var(--font-sans));
  font-size: 0.8125rem;
  font-weight: 300;
  line-height: 1.35;
  letter-spacing: 0.12em;
  text-align: left;
  color: var(--color-text-muted);
}

.book-calendar__weekdays,
.book-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.125rem;
}

.book-calendar__weekdays {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, var(--color-paper));
}

.book-calendar__weekday,
.book-calendar__day {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  font-size: 0.75rem;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--color-text);
}

.book-calendar__weekday {
  font-weight: 400;
  color: var(--color-text-muted);
}

.book-calendar__day--muted {
  color: color-mix(in srgb, var(--color-text) 30%, var(--color-paper));
}

.book-calendar__day--today {
  background: var(--color-surface-pink);
  color: var(--color-text);
}

@media (max-width: 768px) {
  .book-cta,
  .book-cta--footer {
    max-width: none;
  }

  .book-calendar__day,
  .book-calendar__weekday {
    min-height: 2.25rem;
    font-size: 0.8125rem;
  }
}
</style>
