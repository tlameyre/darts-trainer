<script setup>
import ZoneTypePicker from './zone/ZoneTypePicker.vue'
import ZoneBoard from './zone/ZoneBoard.vue'

defineProps({
  modelValue: { required: true },
  multiple:   { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="zone-picker">
    <ZoneTypePicker :model-value="modelValue" :multiple="multiple" @update:model-value="$emit('update:modelValue', $event)" />
    <div class="zone-picker__board">
      <ZoneBoard :model-value="modelValue" :multiple="multiple" @update:model-value="$emit('update:modelValue', $event)" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.zone-picker {
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__board {
    width: 100%;
    max-width: 340px;
    margin: 0 auto;
    aspect-ratio: 1;
  }
}
</style>
