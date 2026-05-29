<script setup>
import AppIcon from './AppIcon.vue'

const emit = defineEmits(['digit', 'delete', 'validate'])

const rows = [
  [
    { label: '1', action: () => emit('digit', '1') },
    { label: '2', action: () => emit('digit', '2') },
    { label: '3', action: () => emit('digit', '3') },
  ],
  [
    { label: '4', action: () => emit('digit', '4') },
    { label: '5', action: () => emit('digit', '5') },
    { label: '6', action: () => emit('digit', '6') },
  ],
  [
    { label: '7', action: () => emit('digit', '7') },
    { label: '8', action: () => emit('digit', '8') },
    { label: '9', action: () => emit('digit', '9') },
  ],
  [
    { icon: 'delete', mod: 'del', action: () => emit('delete') },
    { label: '0', action: () => emit('digit', '0') },
    { icon: 'check', mod: 'validate', action: () => emit('validate') },
  ],
]
</script>

<template>
  <div class="numpad">
    <div v-for="(row, ri) in rows" :key="ri" class="numpad__row">
      <div class="numpad__row-keys">
        <button v-for="key in row" :key="key.icon ?? key.label" class="numpad__key"
          :class="key.mod && `numpad__key--${key.mod}`" @click="key.action">
          <AppIcon v-if="key.icon" :name="key.icon" :width="32" :height="32" />
          <template v-else>{{ key.label }}</template>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.numpad {
  display: flex;
  flex: 1;
  flex-direction: column;

  &__row {
    display: flex;
    flex: 1;
    flex-direction: column;

    &:not(:last-child) .numpad__row-keys {
      border-bottom: $border-md solid $white;
    }
  }

  &__row-keys {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(3, 1fr);
  }

  &__key {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: $text-color;
    @include title-xxl;
    padding: 0;
    transition: background 0.1s, transform 0.08s;

    &:not(:last-child) {
      border-right: $border-md solid $white;
    }

    &:active {
      background: rgba($white, 0.06);
    }

    &--del {
      color: $white;
    }

    &--validate {
      color: $accent;
    }

  }
}
</style>
