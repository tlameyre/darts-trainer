<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['digit', 'undo', 'validate'])

const keys = [
  ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => ({ label: d, action: () => emit('digit', d) })),
  { icon: 'undo', mod: 'undo', aria: 'Volée précédente', action: () => emit('undo') },
  { label: '0', action: () => emit('digit', '0') },
  { icon: 'check', mod: 'validate', aria: 'Valider la volée', action: () => emit('validate') },
]
</script>

<template>
  <div class="numpad">
    <button
      v-for="key in keys"
      :key="key.icon ?? key.label"
      class="numpad__key"
      :class="key.mod && `numpad__key--${key.mod}`"
      :aria-label="key.aria"
      :disabled="locked && key.mod !== 'undo'"
      @click="key.action"
    >
      <AppIcon v-if="key.icon" :name="key.icon" :width="28" :height="28" />
      <template v-else>{{ key.label }}</template>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.numpad {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: $gap-xs;

  &__key {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    border: $border-md solid $text-color;
    background: $bg;
    color: $text-color;
    @include title-xxl;
    transition: transform 0.08s, opacity 0.15s;

    &:active:not(:disabled) { transform: scale(0.96); }
    &:disabled { opacity: 0.4; }

    &--undo {
      background: $surface;
      border-color: $border-color;
    }

    &--validate {
      background: var(--game-color, #{$accent});
      border-color: var(--game-color, #{$accent});
      color: $white;
    }
  }
}

@media (min-width: $bp-laptop) {
  .numpad__key {
    @include display-xs;

    :deep(svg) {
      width: 52px;
      height: 52px;
    }
  }
}
</style>
