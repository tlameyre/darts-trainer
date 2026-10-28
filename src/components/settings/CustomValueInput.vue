<script setup>
defineProps({
  modelValue: { type: [Number, String], required: true },
  show: { type: Boolean, default: true },
  unit: String,
  min: { type: Number, default: 1 },
  max: Number,
  placeholder: String,
})

const emit = defineEmits(['update:modelValue'])

function onInput(event) {
  const { value } = event.target
  emit('update:modelValue', value === '' ? '' : Number(value))
}
</script>

<template>
  <Transition name="slide-fade">
    <label v-if="show" class="custom-value">
      <input
        :value="modelValue"
        type="number"
        :min="min"
        :max="max"
        :placeholder="placeholder"
        class="custom-value__input"
        @input="onInput"
      />
      <span v-if="unit" class="custom-value__unit">{{ unit }}</span>
    </label>
  </Transition>
</template>

<style lang="scss" scoped>
.custom-value {
  display: flex;
  align-items: center;
  gap: $gap-sm;

  &__input {
    @include title-lg;
    flex: 1;
    min-width: 0;
    height: 44px;
    padding: 0 $padding-sm;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $white;
    color: $text-color;
    text-align: center;

    &:focus {
      outline: none;
      border-color: var(--tone);
    }
  }

  &__unit {
    @include title-md;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .custom-value {
    &__input { @include title-xl; height: 56px; }
    &__unit { @include title-lg; }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
