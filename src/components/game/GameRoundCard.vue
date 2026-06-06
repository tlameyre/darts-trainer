<script setup>
import { computed } from 'vue'
import VoleeDisplay from '../VoleeDisplay.vue'

const props = defineProps({
  phase: Number,
  currentScore: Number,
  currentVolee: Array,
  voleeTotal: Number,
  feedbackState: { type: String, default: null },
  correctAnswer: Number,
  showValue: { type: Boolean, default: false },
})

const overlayLabel = computed(() => {
  if (props.feedbackState === 'phase1ok') return 'CORRECT !'
  if (props.feedbackState === 'correct') return 'CORRECT !'
  if (props.feedbackState === 'timeout') return 'TEMPS ÉCOULÉ !'
  return 'RATÉ !'
})

const overlayClass = computed(() => {
  if (props.feedbackState === 'correct' || props.feedbackState === 'phase1ok') return 'round-card__overlay--correct'
  return 'round-card__overlay--wrong'
})
</script>

<template>
  <div class="round-card">
    <template v-if="phase === 1">
      <div class="round-card__top">
        <div class="round-card__label">Score</div>
        <div class="round-card__score">{{ currentScore }}</div>
      </div>
      <div class="round-card__divider" />
      <div class="round-card__bottom">
        <div class="round-card__label">Volée</div>
        <VoleeDisplay :volee="currentVolee" :show-value="showValue" />
      </div>
    </template>

    <template v-else>
      <div class="round-card__top round-card__top--phase2">
        <div class="round-card__label">Score de départ</div>
        <div class="round-card__score">{{ currentScore }}</div>
      </div>
      <div class="round-card__divider" />
      <div class="round-card__bottom">
        <div class="round-card__label">Volée marquée</div>
        <div class="round-card__volee-total">{{ voleeTotal }}</div>
        <div class="round-card__label round-card__label--question">Score restant ?</div>
      </div>
    </template>

    <Transition name="fade">
      <div v-if="feedbackState && feedbackState !== 'phase1ok'" class="round-card__overlay" :class="overlayClass">
        <div class="round-card__overlay-title">{{ overlayLabel }}</div>
        <div v-if="feedbackState === 'wrong' || feedbackState === 'timeout'" class="round-card__overlay-sub">
          Réponse : <strong>{{ correctAnswer }}</strong>
        </div>
      </div>

      <div v-else-if="feedbackState === 'phase1ok'"
        class="round-card__overlay round-card__overlay--correct round-card__overlay--brief">
        <div class="round-card__overlay-title">{{ voleeTotal }}</div>
        <div class="round-card__overlay-sub">Maintenant le score restant</div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.round-card {
  min-height: 0;
  background: $orange;
  border-radius: $radius-lg;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  padding: $padding-md;
  flex: 1;

  &__top {
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: $gap-xs;
    padding-bottom: $padding-md;

    &--phase2 .round-card__score {
      @include display-xs;
    }
  }

  &__label {
    @include text-sm;
    text-transform: uppercase;
    color: $white;

    &--question {
      @include title-xl;
      color: $white;
      text-transform: none;
    }
  }

  &__score {
    @include display-xs;
    line-height: 1;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  &__volee-total {
    @include display-xs;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  &__divider {
    height: $border-md;
    background: $white;
  }

  &__bottom {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    padding-top: $padding-md;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    border-radius: $radius-lg;
    padding: $padding-md;

    &--correct {
      background: $accent-dark;
    }

    &--wrong {
      background: $error-dark;
    }

    &--brief {
      background: $accent-dark;
    }
  }

  &__overlay-title {
    @include display-xs;
    color: $white;
  }

  &__overlay-sub {
    @include text-xl;
    color: $white;
    text-align: center;

    strong {
      @include text-xl;
      color: $white;
    }
  }
}

@media (min-width: $bp-laptop) {
  .round-card {
    &__label       { @include text-md; }
    &__overlay-sub { @include text-xxl; }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
