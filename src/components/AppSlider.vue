<script setup>
defineProps({
  modelValue: { type: Number, required: true },
  min:        { type: Number, default: 1 },
  max:        { type: Number, default: 10 },
  step:       { type: Number, default: 1 },
  label:      { type: String, default: '' },
  valueLabel: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="app-slider">
    <div v-if="label || valueLabel" class="app-slider__header">
      <span class="app-slider__label">{{ label }}</span>
      <span class="app-slider__value">{{ valueLabel }}</span>
    </div>
    <input
      class="app-slider__track"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
    />
    <div class="app-slider__ticks">
      <span
        v-for="n in (max - min) / step + 1"
        :key="n"
        class="app-slider__tick"
        :class="{ 'app-slider__tick--active': (min + (n - 1) * step) <= modelValue }"
      >{{ min + (n - 1) * step }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-slider {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__label {
    @include title-md;
    color: $white;
    font-weight: 700;
  }

  &__value {
    @include title-sm;
    color: $orange;
    font-weight: 700;
  }

  &__track {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: $radius-pill;
    background: rgba($white, 0.15);
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: $orange;
      border: 3px solid $white;
      cursor: pointer;
      transition: transform 0.1s;

      &:active { transform: scale(1.2); }
    }

    &::-moz-range-thumb {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: $orange;
      border: 3px solid $white;
      cursor: pointer;
      border: none;
    }
  }

  &__ticks {
    display: flex;
    justify-content: space-between;
    padding: 0 2px;
  }

  &__tick {
    @include text-xxs;
    color: rgba($white, 0.3);
    width: 20px;
    text-align: center;
    transition: color 0.15s;

    &--active { color: $orange; }
  }
}

@media (min-width: $bp-laptop) {
  .app-slider {
    &__label { @include title-lg; }
    &__value { @include title-md; }
    &__tick  { @include text-xs; }
  }
}
</style>
