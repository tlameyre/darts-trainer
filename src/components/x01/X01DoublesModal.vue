<script setup>
import { computed } from 'vue'
import { canFinish } from '../../composables/useCheckoutAnalysis.js'
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  show:           { type: Boolean, default: false },
  // Reste au début de la volée : ex. 23 impose 1 fléchette de préparation → 2 doubles max
  startRemaining: { type: Number,  default: null },
})

const maxDoubles = computed(() => {
  if (props.startRemaining == null) return 3
  const minDarts = [1, 2, 3].find(n => canFinish(props.startRemaining, n)) ?? 3
  return 3 - (minDarts - 1)
})

defineEmits(['confirm'])
</script>

<template>
  <AppModal :show :z-index="110" size="lg" @close="$emit('confirm', 0)">
    <div class="db-modal__header">
      <p class="db-modal__title">Combien de doubles tentés ?</p>
      <button class="db-modal__close" @click="$emit('confirm', 0)">
        <AppIcon name="close" :width="22" :height="22" />
      </button>
    </div>
    <p class="db-modal__hint">Incluant les doubles manqués dans cette volée</p>
    <div class="db-modal__options">
      <button
        v-for="n in [0, 1, 2, 3]"
        :key="n"
        class="db-modal__btn"
        :disabled="n > maxDoubles"
        @click="$emit('confirm', n)"
      >
        {{ n }}
      </button>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.db-modal {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title { @include title-xl; }

  &__close {
    color: $text-color;
    display: flex;
    padding: $padding-xxs;
    transition: opacity 0.15s;
    &:active { opacity: 0.6; }
  }

  &__hint {
    @include text-sm;
    color: $muted;
    margin-top: -$gap-xs;
  }

  &__options {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__btn {
    height: 64px;
    border-radius: $radius-sm;
    border: $border-md solid $text-color;
    color: $text-color;
    @include title-xxxl;
    transition: background 0.15s, transform 0.1s;

    &:active:not(:disabled) {
      background: var(--game-color, #{$accent});
      border-color: var(--game-color, #{$accent});
      color: $white;
      transform: scale(0.96);
    }

    &:disabled { opacity: 0.2; cursor: default; }
  }
}

@media (min-width: $bp-laptop) {
  .db-modal {
    &__title { @include title-xxl; }
    &__hint  { @include text-md; }
    &__btn   { height: 80px; @include display-xs; }
  }
}
</style>
