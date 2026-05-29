<script setup>
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
      <button v-for="opt in options" :key="opt.value" class="option-selector__btn"
        :class="{ 'option-selector__btn--active': modelValue === opt.value }"
        @click="$emit('update:modelValue', opt.value)">
        {{ opt.label }}
      </button>
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
  }

  &__btn {
    flex: 1;
    background: transparent;
    border: $border-md solid $white;
    border-radius: $radius-sm;
    color: $white;
    @include title-sm;
    padding: $padding-sm;
    transition: all 0.15s;

    &--active {
      background: $orange;
      border-color: $orange;
      color: $white;
    }
  }
}
</style>
