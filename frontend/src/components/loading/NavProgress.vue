<template>
  <div
    class="nav-progress"
    :class="{ 'is-active': active, 'is-done': done }"
    aria-hidden="true"
  >
    <span class="nav-progress__bar" />
  </div>
</template>

<script setup>
import { useNavProgressState } from '../../composables/useNavProgress.js';

const { active, done } = useNavProgressState();
</script>
