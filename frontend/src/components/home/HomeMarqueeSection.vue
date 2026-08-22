<template>
  <component
    :is="embedded ? 'div' : 'section'"
    :id="embedded ? undefined : (sectionId || undefined)"
    class="home-marquee"
    :class="[sectionClass, embedded ? null : 'home-section']"
    :aria-label="ariaLabel || undefined"
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
        :show-fade="showFade"
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
  </component>
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
  },
  embedded: {
    type: Boolean,
    default: false
  },
  showFade: {
    type: Boolean,
    default: true
  }
});

function itemKey(item, index) {
  return item?.id != null ? `${item.id}-${index}` : String(index);
}
</script>
