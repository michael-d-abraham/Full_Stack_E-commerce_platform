<template>
  <section
    class="home-testimonials home-section"
    aria-label="Client reviews"
  >
    <div
      v-if="backgroundImageUrl"
      class="home-testimonials__background home-section__background"
      :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
      aria-hidden="true"
    />
    <div class="home-testimonials__marquee-wrap">
      <Marquee
        pause-on-hover
        :fade-color="fadeColor"
        duration="40s"
        gap="32px"
      >
        <MarqueeItem v-for="item in testimonials" :key="item.id">
          <TestimonialCard
            :quote="item.quote"
            :name="item.name"
            :role="item.role"
            :avatar-url="item.avatarUrl"
          />
        </MarqueeItem>
      </Marquee>
    </div>
  </section>
</template>

<script setup>
import Marquee from '../marquee/Marquee.vue';
import MarqueeItem from '../marquee/MarqueeItem.vue';
import TestimonialCard from '../testimonial/TestimonialCard.vue';
import { PLACEHOLDER_TESTIMONIALS } from '../../constants/testimonials.js';

defineProps({
  backgroundImageUrl: {
    type: String,
    default: ''
  }
});

const fadeColor = '#f2f2f2';
const testimonials = PLACEHOLDER_TESTIMONIALS;
</script>
