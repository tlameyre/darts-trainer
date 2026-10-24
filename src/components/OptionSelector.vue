<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true },
  modelValue: { required: true },
  tone: { type: String, default: 'orange', validator: v => ['orange', 'blue', 'green', 'cyan'].includes(v) },
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
        :aria-label="opt.icon ? opt.label : undefined"
        @click="$emit('update:modelValue', opt.value)"
      >
        <AppIcon v-if="opt.icon" :name="opt.icon" :width="22" :height="22" />
        <template v-else>{{ opt.label }}</template>
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
    min-width: 0;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
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

  &--green &__option--active {
    background: $accent;
    border-color: $accent;
  }

  &--cyan &__option--active {
    background: $mode-checkout;
    border-color: $mode-checkout;
  }
}

@media (min-width: $bp-laptop) {
  .option-selector__option {
    @include title-xl;
    height: 56px;
  }
}
</style>
