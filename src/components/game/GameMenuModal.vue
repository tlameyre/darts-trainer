<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  show: { type: Boolean, required: true },
})

defineEmits(['finish', 'quit', 'close'])
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="menu-modal" @click.self="$emit('close')">
      <div class="menu-modal__panel">
        <div class="menu-modal__header">
          <span class="menu-modal__title">Partie en cours</span>
          <button class="menu-modal__close" @click="$emit('close')">
            <AppIcon name="stop" :width="20" :height="20" />
          </button>
        </div>

        <button class="menu-modal__item menu-modal__item--finish" @click="$emit('finish')">
          <AppIcon name="check" :width="20" :height="20" />
          Terminer la partie
        </button>

        <button class="menu-modal__item menu-modal__item--quit" @click="$emit('quit')">
          <AppIcon name="exit" :width="20" :height="20" />
          Quitter sans sauvegarder
        </button>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.menu-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 100;

  &__panel {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    background: #1e2a26;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: $padding-md $padding-md $padding-xxl;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: $gap-sm;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__close {
    color: $muted;
    display: flex;
    align-items: center;
    transition: color 0.15s;

    &:active { color: $text-color; }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    @include text-sm;
    padding: $padding-md;
    border-radius: $radius-md;
    transition: background 0.15s;
    text-align: left;

    &:active { background: rgba(255, 255, 255, 0.06); }

    &--finish { color: $accent; }
    &--quit   { color: $error; }
  }
}

.modal-enter-active,
.modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
