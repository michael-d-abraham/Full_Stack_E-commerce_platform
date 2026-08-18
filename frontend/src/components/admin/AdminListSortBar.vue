<template>
  <div class="admin-page-toolbar">
    <label :for="selectId" class="admin-page-toolbar__label">Sort</label>
    <select
      :id="selectId"
      class="admin-page-toolbar__select"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
  selectId: { type: String, required: true }
});

defineEmits(['update:modelValue']);
</script>
