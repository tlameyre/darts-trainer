<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  value: { type: String, required: true },
  hasError: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Entrer un score' },
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
  align-items: stretch;
  background: $white;
  border-radius: $radius-pill;
  overflow: hidden;
  padding: $padding-xs ;
  flex-shrink: 0;
  transition: box-shadow 0.2s;

  &--error {
    box-shadow: inset 0 0 0 $border-md $error;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: $padding-md;
    color: $black;
    flex-shrink: 0;
  }

  &__value {
    flex: 1;
    display: flex;
    align-items: center;
    padding-left: $padding-sm;
    @include title-xl;
    color: $black;
    font-variant-numeric: tabular-nums;

    &--placeholder {
      @include text-sm;
      color: $input-placeholder;
    }
  }

  &__btn {
    background: $accent;
    border-radius: $radius-pill;
    color: $white;
    @include title-md;
    padding: $padding-xs $padding-md;
    margin-left: $gap-xs;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
    flex-shrink: 0;

    &:active {
      transform: scale(0.95);
      background: $accent-dark;
    }
  }
}

@media (min-width: $bp-laptop) {
  .answer-input {
    padding: $padding-md;

    &__value {
      @include title-xxl;
      &--placeholder { @include text-md; }
    }

    &__btn {
      @include title-lg;
      padding: $padding-sm $padding-xxl;
    }
  }
}
</style>
