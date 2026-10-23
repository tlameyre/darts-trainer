<script setup>
defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true },
  modelValue: { required: true },
  tone: { type: String, default: 'orange', validator: v => ['orange', 'blue'].includes(v) },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="option-selector" :class="`option-selector--${tone}`">
    <div class="option-selector__label">{{ label }}</div>
    <div class="option-selector__options">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="option-selector__option"
        :class="{ 'option-selector__option--active': modelValue === opt.value }"
        :aria-pressed="modelValue === opt.value"
        @click="$emit('update:modelValue', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.option-selector {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__options {
    display: flex;
    gap: $gap-xs;
  }

  &__option {
    @include title-md;
    flex: 1;
    height: 44px;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: transparent;
    color: $text-color;
    transition: background 0.15s, border-color 0.15s;

    &:active {
      transform: scale(0.98);
    }

    &--active {
      background: $orange;
      border-color: $orange;
      color: $white;
    }
  }

  &--blue &__option--active {
    background: $blue;
    border-color: $blue;
  }
}

@media (min-width: $bp-laptop) {
  .option-selector__option {
    @include title-xl;
    height: 56px;
  }
}
</style>
