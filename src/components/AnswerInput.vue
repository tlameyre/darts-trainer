<script setup>
defineProps({
  value:    { type: String,  required: true },
  hasError: { type: Boolean, default: false },
})

defineEmits(['validate'])
</script>

<template>
  <div class="answer-input">
    <div class="answer-input__label">Total de la volée =</div>
    <div class="answer-input__row">
      <div
        class="answer-input__display"
        :class="{ 'answer-input__display--error': hasError }"
      >
        {{ value || '?' }}
      </div>
      <button class="answer-input__btn" @click="$emit('validate')">OK</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.answer-input {
  background: $card;
  border: 1px solid $border;
  border-radius: $radius-lg;
  padding: 10px 14px;

  &__label {
    font-size: 11px;
    color: $muted;
    margin-bottom: 6px;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__display {
    flex: 1;
    background: $bg;
    border: 2px solid $border;
    border-radius: $radius-md;
    color: $text;
    font-size: 22px;
    font-weight: 700;
    text-align: center;
    padding: 9px 10px;
    font-variant-numeric: tabular-nums;
    transition: border-color 0.2s;

    &--error { border-color: $red; }
  }

  &__btn {
    background: $accent;
    border-radius: $radius-md;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    padding: 9px 20px;
    transition: background 0.15s, transform 0.1s;

    &:active {
      transform: scale(0.96);
      background: $accent-dark;
    }
  }
}
</style>
