<script setup>
import { computed } from 'vue'

const props = defineProps({
  correctCount: { type: Number, required: true },
  maxQuestions: { type: Number, required: true },
  best: { type: Number, required: true },
})

defineEmits(['replay', 'home'])

// Couleur selon taux de réussite : <40% rouge, 40-70% orange, ≥70% vert
const scoreColor = computed(() => {
  if (!props.maxQuestions) return 'var(--color-accent)'
  const ratio = props.correctCount / props.maxQuestions
  if (ratio < 0.4) return 'var(--color-error)'
  if (ratio < 0.7) return 'var(--color-orange)'
  return 'var(--color-accent)'
})

const scoreColorStreak = computed(() => {
  if (!props.maxQuestions) return 'var(--color-accent)'
  const ratio = props.best / props.maxQuestions
  if (ratio < 0.4) return 'var(--color-error)'
  if (ratio < 0.7) return 'var(--color-orange)'
  return 'var(--color-accent)'
})
</script>

<template>
  <div class="game-over__title">FIN DE PARTIE</div>
  <div class="game-over">
    <div class="game-over__result">
      <div class="game-over__score" :style="{ color: scoreColor }">{{ correctCount }}<span>/{{ maxQuestions }}</span>
      </div>
      <div class="game-over__label">bonnes réponses</div>
    </div>

    <div class="game-over__stat">
      <div class="game-over__stat-label">Meilleure série :</div>
      <div class="game-over__stat-value"><strong :style="{ color: scoreColorStreak }">{{ best }}</strong> bonnes
        réponses</div>
    </div>

  </div>
  <div class="game-over__actions">
    <button class="game-over__btn game-over__btn--primary" @click="$emit('replay')">
      Rejouer
    </button>
    <button class="game-over__btn game-over__btn--secondary" @click="$emit('home')">
      Accueil
    </button>
  </div>
</template>

<style lang="scss" scoped>
.game-over {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $gap-xxl;

  &__title {
    @include title-xl;
    margin: 0 auto;
  }

  &__result {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__score {
    @include title-xxl;
    font-size: 96px;
    font-variant-numeric: tabular-nums;

    span {
      @include text-xxl;
      color: $white;
      font-size: 48px;
    }
  }

  &__label {
    @include text-lg;
    text-transform: uppercase;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    @include text-lg;

    strong {
      color: $text-color;
      font-weight: 700;
    }

    display: flex;
    flex-direction: column;
    align-items: center;

    &-label {
      @include title-xl;
    }
  }

  &__actions {
    display: flex;
    gap: $gap-xs;
    width: 100%;
  }

  &__btn {
    flex: 1;
    border-radius: $radius-sm;
    @include title-lg;
    padding: $padding-sm $padding-lg;
    transition: transform 0.1s, opacity 0.15s;

    &:active {
      transform: scale(0.97);
      opacity: 0.85;
    }

    &--primary {
      background: $orange;
      color: $white;
    }

    &--secondary {
      background: transparent;
      border: 1px solid $white;
      color: $white;
    }
  }
}
</style>
