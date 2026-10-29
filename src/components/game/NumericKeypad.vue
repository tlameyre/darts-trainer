<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  // Bottom-left key: step back to the previous volley, or erase the last typed digit
  leftKey: { type: String, default: 'undo', validator: v => ['undo', 'delete'].includes(v) },
  // 'tone' follows the mode (or match) color, 'ink' is black
  confirmTone: { type: String, default: 'tone', validator: v => ['tone', 'ink'].includes(v) },
  confirmLabel: { type: String, default: 'Valider' },
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['digit', 'left', 'validate'])

const LEFT_KEYS = {
  undo:   { icon: 'undo',   label: 'Volée précédente' },
  delete: { icon: 'delete', label: 'Effacer' },
}

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
</script>

<template>
  <div class="keypad">
    <button v-for="d in digits" :key="d" class="keypad__key" :disabled="locked" @click="emit('digit', d)">{{ d }}</button>

    <button class="keypad__key keypad__key--left" :aria-label="LEFT_KEYS[leftKey].label" @click="emit('left')">
      <AppIcon :name="LEFT_KEYS[leftKey].icon" :width="28" :height="28" />
    </button>
    <button class="keypad__key" :disabled="locked" @click="emit('digit', '0')">0</button>
    <button
      class="keypad__key keypad__key--confirm"
      :class="`keypad__key--${confirmTone}`"
      :aria-label="confirmLabel"
      :disabled="locked"
      @click="emit('validate')"
    >
      <AppIcon name="check" :width="28" :height="28" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
// A view sets --key-min when the keypad sits in an auto-height area on mobile
.keypad {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: minmax(var(--key-min, 0px), 1fr);
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

    &--left {
      background: $surface;
      border-color: $border-color;
    }

    &--confirm { color: $white; }

    &--tone {
      background: var(--game-color, var(--tone, #{$accent}));
      border-color: var(--game-color, var(--tone, #{$accent}));
    }

    &--ink {
      background: $black;
      border-color: $black;
    }
  }
}

@media (min-width: $bp-laptop) {
  .keypad__key {
    @include display-xs;

    :deep(svg) {
      width: 44px;
      height: 44px;
    }
  }
}
</style>
