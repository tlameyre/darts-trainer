<script setup>
import AppIcon from '../AppIcon.vue'

const emit = defineEmits(['digit', 'delete', 'validate'])

const keys = [
  ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => ({ id: d, label: d, action: () => emit('digit', d) })),
  { id: 'delete', icon: 'delete', mod: 'delete', label: 'Effacer', action: () => emit('delete') },
  { id: '0', label: '0', action: () => emit('digit', '0') },
  { id: 'ok', label: 'OK', mod: 'ok', action: () => emit('validate') },
]
</script>

<template>
  <div class="keypad">
    <button
      v-for="key in keys"
      :key="key.id"
      class="keypad__key"
      :class="key.mod && `keypad__key--${key.mod}`"
      :aria-label="key.icon ? key.label : undefined"
      @click="key.action"
    >
      <AppIcon v-if="key.icon" :name="key.icon" :width="28" :height="28" />
      <template v-else>{{ key.label }}</template>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.keypad {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: 88px;
  gap: $gap-xs;

  &__key {
    @include title-xxl;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    background: $bg;
    color: $black;
    transition: transform 0.08s, background 0.1s;

    &:active {
      transform: scale(0.97);
      background: $surface;
    }

    &--delete {
      border-color: $border-color;
      background: $surface;
    }

    &--ok {
      background: $black;
      color: $white;

      &:active {
        background: $black;
      }
    }
  }
}

@media (min-width: $bp-laptop) {
  .keypad {
    flex: 1;
    grid-auto-rows: minmax(0, 1fr);

    &__key {
      @include title-xxxl;
    }
  }
}
</style>
