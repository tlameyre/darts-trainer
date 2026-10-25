<script setup>
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'

defineProps({
  show:        { type: Boolean, required: true },
  finishLabel: { type: String, default: 'Terminer la partie' },
  quitLabel:   { type: String, default: 'Quitter sans sauvegarder' },
})

defineEmits(['finish', 'quit', 'close'])
</script>

<template>
  <AppModal :show title="Partie en cours" centered @close="$emit('close')">
    <div class="gm-modal">
      <button class="gm-modal__item gm-modal__item--finish" @click="$emit('finish')">
        <AppIcon name="check" :width="22" :height="22" />
        {{ finishLabel }}
      </button>

      <button class="gm-modal__item gm-modal__item--quit" @click="$emit('quit')">
        <AppIcon name="exit" :width="22" :height="22" />
        {{ quitLabel }}
      </button>

      <button class="gm-modal__item" @click="$emit('close')">
        <AppIcon name="arrow-left" :width="22" :height="22" />
        Reprendre la partie
      </button>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.gm-modal {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__item {
    height: 56px;
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: 0 $padding-md;
    border-radius: $radius-sm;
    border: $border-md solid $text-color;
    color: $text-color;
    @include title-lg;
    text-align: left;
    transition: opacity 0.15s;

    &:active { opacity: 0.75; }

    &--finish {
      background: var(--game-color, #{$accent});
      border-color: var(--game-color, #{$accent});
      color: $white;
    }

    &--quit {
      border-color: $error;
      color: $error;
    }
  }
}

@media (min-width: $bp-laptop) {
  .gm-modal__item {
    height: 64px;
    @include title-xl;
  }
}
</style>
