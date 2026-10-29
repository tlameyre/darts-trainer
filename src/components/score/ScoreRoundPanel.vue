<script setup>
defineProps({
  phase: { type: Number, required: true },
  currentScore: { type: Number, required: true },
  currentVolee: { type: Array, required: true },
  voleeTotal: { type: Number, default: 0 },
  showDartValue: Boolean,
})
</script>

<template>
  <section class="round-panel">
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
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  min-height: 0;
  color: $white;

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
