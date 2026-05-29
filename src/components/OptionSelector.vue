<script setup>
import AppButton from './AppButton.vue'

defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true },
  modelValue: { required: true },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="option-selector">
    <div class="option-selector__label">{{ label }}</div>
    <div class="option-selector__options">
      <AppButton
        v-for="opt in options"
        :key="opt.value"
        size="small"
        variant="ghost"
        :active="modelValue === opt.value"
        @click="$emit('update:modelValue', opt.value)"
      >
        {{ opt.label }}
      </AppButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.option-selector {
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__label {
    @include title-lg;
    color: $white;
  }

  &__options {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) { flex: 1; }
  }
}
</style>
