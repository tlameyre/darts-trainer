<script setup>
const props = defineProps({
  // Index of the step in progress
  step:  { type: Number, required: true },
  error: { type: Boolean, default: false },
})

const STEPS = ['Défi envoyé', 'Accepté', 'Qui commence', 'Partie']

function stateOf(index) {
  if (index < props.step) return 'done'
  if (index === props.step) return props.error ? 'error' : 'current'
  return 'todo'
}
</script>

<template>
  <ol class="stepper" aria-label="Étapes du défi">
    <li v-for="(label, i) in STEPS" :key="label" class="stepper__step" :class="`stepper__step--${stateOf(i)}`">
      <span class="stepper__bar"><span class="stepper__fill" /></span>
      <span class="stepper__label">{{ label }}</span>
    </li>
  </ol>
</template>

<style lang="scss" scoped>
.stepper {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  list-style: none;

  &__step {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__bar {
    height: 6px;
    border-radius: 2px;
    background: $border-color;
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    width: 0;
    background: $mode-online;
  }

  &__label {
    @include text-xxs;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $muted;
  }

  &__step--done {
    .stepper__fill  { width: 100%; }
    .stepper__label { color: $text-color; }
  }

  &__step--current {
    .stepper__fill  { width: 50%; }
    .stepper__label { color: $mode-online; }
  }

  &__step--error {
    .stepper__fill  { width: 100%; background: $error; }
    .stepper__label { color: $error; }
  }
}

@media (min-width: $bp-laptop) {
  .stepper {
    gap: 10px;

    &__bar   { height: 8px; }
    &__label { @include text-sm; }
  }
}
</style>
