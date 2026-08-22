<template>
  <section
    :id="sectionId || undefined"
    class="home-marquee home-section"
    :class="sectionClass"
    :aria-label="ariaLabel"
  >
    <div
      v-if="backgroundImageUrl"
      class="home-marquee__background home-section__background"
      :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
      aria-hidden="true"
    />
    <div class="home-marquee__wrap">
      <Marquee
        pause-on-hover
        show-fade
        fade-color="var(--color-bg)"
        duration="40s"
        gap="32px"
      >
        <MarqueeItem v-for="(item, index) in items" :key="itemKey(item, index)">
          <MarqueeTile
            :variant="item.variant || 'quote'"
            :quote="item.quote"
            :name="item.name"
            :role="item.role"
            :avatar-url="item.avatarUrl"
            :src="item.src"
            :alt="item.alt"
            :priority="index < 4"
          />
        </MarqueeItem>
      </Marquee>
    </div>
  </section>
</template>

<script setup>
import Marquee from '../marquee/Marquee.vue';
import MarqueeItem from '../marquee/MarqueeItem.vue';
import MarqueeTile from '../marquee/MarqueeTile.vue';

defineProps({
  ariaLabel: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  sectionId: {
    type: String,
    default: ''
  },
  sectionClass: {
    type: [String, Array, Object],
    default: ''
  },
  backgroundImageUrl: {
    type: String,
    default: ''
  }
});

function itemKey(item, index) {
  return item?.id != null ? `${item.id}-${index}` : String(index);
}
</script>
