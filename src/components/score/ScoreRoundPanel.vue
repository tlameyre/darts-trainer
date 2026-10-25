<script setup>
import { computed, watch, ref } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  phase: { type: Number, required: true },
  showPhase: Boolean,
  streak: { type: Number, default: 0 },
  questionIndex: { type: Number, required: true },
  maxQuestions: { type: Number, default: null },
  timeLeft: { type: Number, default: null },
  showTimer: Boolean,
  currentScore: { type: Number, required: true },
  currentVolee: { type: Array, required: true },
  voleeTotal: { type: Number, default: 0 },
  showDartValue: Boolean,
})

const progress = computed(() =>
  props.maxQuestions ? `${Math.min(props.questionIndex / props.maxQuestions, 1) * 100}%` : null
)

const isBouncing = ref(false)

const maxScale = computed(() => {
  const baseScale = 1
  const growth = props.streak * 0.1
  return Math.min(baseScale + growth, 2.2)
})

watch(() => props.streak, (newVal, oldVal) => {
  if (newVal > oldVal && newVal > 0) {
    isBouncing.value = true

    setTimeout(() => {
      isBouncing.value = false
    }, 300)
  }
})
</script>

<template>
  <section class="round-panel">
    <div class="round-panel__status">
      <div class="round-panel__streak-badge">
        <span class="round-panel__streak-label"
              :class="{ 'is-bouncing': isBouncing }"
              :style="{ '--max-scale': maxScale }"
        >
          Série
          <span class="round-panel__streak-value">×{{ streak }}</span>
        </span>
      </div>
      <div v-if="progress" class="round-panel__progress">
        <div class="round-panel__progress-fill" :style="{ width: progress }" />
      </div>
      <span v-else class="round-panel__spacer" />
      <span class="round-panel__count">{{ questionIndex }}<template v-if="maxQuestions">/{{ maxQuestions }}</template></span>
      <span v-if="showPhase" class="round-panel__badge">Étape {{ phase }}/2</span>
      <span v-if="showTimer" class="round-panel__badge" :class="{ 'round-panel__badge--urgent': timeLeft <= 5 }">
        <AppIcon name="clock" :width="16" :height="16" />{{ timeLeft }}s
      </span>
    </div>

    <div class="round-panel__body">
      <div class="round-panel__block">
        <span class="round-panel__label">Reste</span>
        <span class="round-panel__score">{{ currentScore }}</span>
      </div>

      <div class="round-panel__divider" />

      <div v-if="phase === 1" class="round-panel__block round-panel__block--volee">
        <span class="round-panel__label">Volée</span>
        <div class="round-panel__darts">
          <div v-for="(dart, i) in currentVolee" :key="i" class="round-panel__dart">
            <span class="round-panel__dart-label">{{ dart.label }}</span>
            <span v-if="showDartValue" class="round-panel__dart-value">{{ dart.pts }}</span>
          </div>
        </div>
      </div>

      <div v-else class="round-panel__block round-panel__block--volee">
        <span class="round-panel__label">Volée marquée</span>
        <span class="round-panel__total">{{ voleeTotal }}</span>
        <span class="round-panel__question">Score restant ?</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.round-panel {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  min-height: 0;
  color: $white;

  &__status {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__streak-badge {
    @include title-sm;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: $black;
  }

  &__streak-label.is-bouncing {
    animation: bounceEffect 0.3s ease-in-out;
  }

  @keyframes bounceEffect {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(var(--max-scale)); /* Taille maximale du rebond */
    }
    100% {
      transform: scale(1);
    }
  }

  &__streak-value {
    color: $orange-light;
  }



  &__progress {
    flex: 1;
    height: 8px;
    background: rgba($white, 0.3);
  }

  &__progress-fill {
    height: 100%;
    background: $white;
    transition: width 0.3s;
  }

  &__spacer {
    flex: 1;
  }

  &__count {
    @include title-md;
    font-variant-numeric: tabular-nums;
  }

  &__badge {
    @include title-xxs;
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    padding: $padding-xxs $padding-xs;
    border: $border-md solid $white;
    border-radius: $radius-sm;
    font-variant-numeric: tabular-nums;

    &--urgent {
      background: $error;
      border-color: $error;
    }
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__block {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;

    &--volee {
      flex: 1.2;
    }
  }

  &__label {
    @include text-sm;
    text-transform: uppercase;
    letter-spacing: $tracking-lg;
    opacity: 0.9;
  }

  &__score,
  &__total {
    @include display-xs;
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
  }

  &__divider {
    height: $border-md;
    background: $white;
  }

  &__darts {
    align-self: stretch;
    display: flex;
    justify-content: center;
    gap: $gap-xs;
  }

  // Flexible tiles so the panel width never depends on the volley
  &__dart {
    flex: 1;
    min-width: 0;
    max-width: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-xs 0;
    border-radius: $radius-sm;
    background: rgba($white, 0.16);
  }

  &__dart-label {
    @include title-xxxl;
    line-height: 1;
  }

  &__dart-value {
    @include title-sm;
    padding: 0 $padding-xs;
    border-radius: $radius-xs;
    background: $black;
  }

  &__question {
    @include title-xl;
    margin-top: $gap-xs;
  }
}

@media (min-width: $bp-laptop) {
  .round-panel {
    gap: $gap-lg;

    &__streak   { @include title-lg; padding: $padding-xs $padding-sm; }
    &__progress { height: 10px; }
    &__count    { @include title-xl; }
    &__badge    { @include title-sm; }
    &__label    { @include text-lg; }

    &__score,
    &__total {
      @include display-lg;
    }

    &__darts { gap: $gap-md; }

    &__dart {
      max-width: 184px;
      gap: $gap-sm;
      padding: $padding-md 0;
    }

    &__dart-label { @include display-md; }
    &__dart-value { @include title-xl; }
    &__question   { @include title-xxl; }
  }
}
</style>
