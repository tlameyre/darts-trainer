<script setup>
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'

defineProps({
  show: { type: Boolean, required: true },
})

defineEmits(['finish', 'quit', 'close'])
</script>

<template>
  <AppModal :show title="Partie en cours" @close="$emit('close')">
    <button class="gm-modal__item gm-modal__item--finish" @click="$emit('finish')">
      <AppIcon name="check" :width="20" :height="20" />
      Terminer la partie
    </button>

    <button class="gm-modal__item gm-modal__item--quit" @click="$emit('quit')">
      <AppIcon name="exit" :width="20" :height="20" />
      Quitter sans sauvegarder
    </button>
  </AppModal>
</template>

<style lang="scss" scoped>
.gm-modal {
  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    @include text-sm;
    padding: $padding-md;
    border-radius: $radius-md;
    transition: background 0.15s;
    text-align: left;

    &:active { background: rgba($white, 0.06); }

    &--finish { color: $accent; }
    &--quit   { color: $error; }
  }
}
</style>
