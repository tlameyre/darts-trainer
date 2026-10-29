<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import SettingsSection from './SettingsSection.vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 1 },
  max: { type: Number, default: 9 },
  // Lead-in of the hint, e.g. "Premier à" → "Premier à 2 manches"
  phrase: { type: String, default: 'Premier à' },
})

const emit = defineEmits(['update:modelValue'])

const hint = computed(() => `${props.phrase} ${props.modelValue} manche${props.modelValue > 1 ? 's' : ''}`)
</script>

<template>
  <SettingsSection label="Manches à gagner" :hint="hint">
    <div class="legs-stepper">
      <button
        class="legs-stepper__btn"
        aria-label="Moins de manches"
        :disabled="modelValue <= min"
        @click="emit('update:modelValue', modelValue - 1)"
      ><AppIcon name="minus" :width="24" :height="24" /></button>
      <span class="legs-stepper__value">{{ modelValue }}</span>
      <button
        class="legs-stepper__btn legs-stepper__btn--up"
        aria-label="Plus de manches"
        :disabled="modelValue >= max"
        @click="emit('update:modelValue', modelValue + 1)"
      ><AppIcon name="plus" :width="24" :height="24" /></button>
    </div>
  </SettingsSection>
</template>

<style lang="scss" scoped>
.legs-stepper {
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  gap: $gap-xs;

  &__btn {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &--up {
      border-color: var(--tone);
      background: var(--tone);
      color: $white;
    }

    &:disabled { opacity: 0.4; }
  }

  &__value {
    @include title-xxxl;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $surface;
    line-height: 1;
  }
}

@media (min-width: $bp-laptop) {
  .legs-stepper {
    grid-template-columns: 64px 1fr 64px;

    &__btn { height: 64px; }
    &__value { @include display-xs; height: 64px; }
  }
}
</style>
