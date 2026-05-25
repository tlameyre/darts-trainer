<script setup>
defineProps({
  value:       { type: String,  required: true },
  hasError:    { type: Boolean, default: false },
  placeholder: { type: String,  default: 'Entrer un score' },
})

defineEmits(['validate'])
</script>

<template>
  <div class="answer-input" :class="{ 'answer-input--error': hasError }">

    <div class="answer-input__value" :class="{ 'answer-input__value--placeholder': !value }">
      {{ value || placeholder }}
    </div>

    <button class="answer-input__btn" @click="$emit('validate')">
      OK
    </button>
  </div>
</template>

<style lang="scss" scoped>
.answer-input {
  display: flex;
  align-items: center;
  gap: $gap-xs;
  background: $input-bg;
  border: 3px solid transparent;
  border-radius: $radius-pill;
  padding: $padding-xxs $padding-xxs $padding-xxs $padding-xl;
  transition: border-color 0.2s;

  &--error { border-color: $error; }

  &__icon {
    flex-shrink: 0;
    color: $input-icon;
    display: flex;
    align-items: center;
  }

  &__value {
    flex: 1;
    font-family: $font-display;
    font-size: $title-sm;
    color: $input-text;
    font-variant-numeric: tabular-nums;

    &--placeholder {
      font-family: $font-body;
      font-size: $text-sm;
      font-weight: 400;
      color: $input-placeholder;
    }
  }

  &__btn {
    background: $accent;
    border-radius: $radius-pill;
    color: $white;
    font-family: $font-body;
    font-size: $text-sm;
    font-weight: 600;
    padding: $padding-xs $padding-xl;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
    flex-shrink: 0;

    &:active {
      transform: scale(0.95);
      background: $accent-dark;
    }
  }
}
</style>
