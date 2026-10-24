<script setup>
import AppIcon from '../AppIcon.vue'
import AppTabs from '../AppTabs.vue'

defineProps({
  tabs:      { type: Array,   required: true },
  mode:      { type: String,  required: true },
  label:     { type: String,  default: null }, // current period ("2026"); no stepper when null
  canPrev:   { type: Boolean, default: true },
  canNext:   { type: Boolean, default: false },
  caption:   { type: String,  default: 'Précision moyenne · toutes zones' },
  accuracy:  { type: [String, Number], required: true },
  sessions:  { type: [String, Number], required: true },
  best:      { type: String,  required: true },
})

defineEmits(['update:mode', 'prev', 'next'])
</script>

<template>
  <section class="period-hero" aria-label="Période et résumé global">
    <div class="period-hero__nav">
      <AppTabs :tabs="tabs" :model-value="mode" variant="bar" @update:model-value="$emit('update:mode', $event)" />

      <div v-if="label" class="period-hero__stepper">
        <button class="period-hero__step" aria-label="Période précédente" :disabled="!canPrev" @click="$emit('prev')">
          <AppIcon name="angle-down" :width="28" :height="28" class="period-hero__chevron period-hero__chevron--prev" />
        </button>
        <span class="period-hero__label">{{ label }}</span>
        <button class="period-hero__step" aria-label="Période suivante" :disabled="!canNext" @click="$emit('next')">
          <AppIcon name="angle-down" :width="28" :height="28" class="period-hero__chevron period-hero__chevron--next" />
        </button>
      </div>
    </div>

    <div class="period-hero__summary">
      <div class="period-hero__main">
        <span class="period-hero__caption">{{ caption }}</span>
        <span class="period-hero__value">{{ accuracy }}<span class="period-hero__unit">%</span></span>
      </div>
      <div class="period-hero__metrics">
        <span class="period-hero__metric">
          <span class="period-hero__metric-label">Sessions</span>
          <span class="period-hero__metric-value">{{ sessions }}</span>
        </span>
        <span class="period-hero__metric">
          <span class="period-hero__metric-label">Meilleure<span class="period-hero__metric-suffix"> séance</span></span>
          <span class="period-hero__metric-value">{{ best }}</span>
        </span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.period-hero {
  display: flex;
  flex-direction: column;
  background: $blue;
  color: $white;

  &__stepper {
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    padding: $padding-xxs $padding-sm;
  }

  &__step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    color: $white;

    &:disabled { opacity: 0.35; cursor: default; }
  }

  &__chevron {
    &--prev { transform: rotate(90deg); }
    &--next { transform: rotate(-90deg); }
  }

  &__label {
    @include title-xxl;
    text-align: center;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
  }

  &__summary {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: $padding-xxs $padding-md 18px;
  }

  &__main {
    display: flex;
    flex-direction: column;
  }

  &__caption {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.85;
  }

  &__value {
    @include display-sm;
    line-height: 0.9;
    text-transform: uppercase;
  }

  &__unit { font-size: 0.5em; }

  &__metrics {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $gap-xxs;
    padding-bottom: $padding-xxs;
  }

  &__metric {
    display: flex;
    align-items: baseline;
    gap: $gap-xxs;
  }

  &__metric-label {
    @include text-xs;
    opacity: 0.85;
  }

  &__metric-suffix { display: none; }

  &__metric-value {
    @include title-xl;
    text-transform: uppercase;
  }
}

@media (min-width: $bp-laptop) {
  .period-hero {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: $gap-xxl;
    padding: $padding-xl $padding-xxl;

    &__nav {
      display: flex;
      flex-direction: column;
      gap: $gap-xs;
    }

    &__stepper {
      display: flex;
      gap: $gap-xs;
      padding: 0;
    }

    &__label {
      min-width: 96px;
      font-size: 28px;
    }

    &__summary {
      align-items: flex-end;
      gap: $gap-xxl;
      padding: 0;
    }

    &__caption { @include text-sm; }
    &__value { @include display-lg; }

    &__metrics {
      flex-direction: row;
      align-items: flex-end;
      gap: $gap-xxl;
      padding-bottom: $padding-xs;
    }

    &__metric {
      flex-direction: column;
      gap: 0;
    }

    &__metric-label { @include text-sm; }
    &__metric-suffix { display: inline; }
    &__metric-value { @include title-xxxl; line-height: 1; }
  }
}
</style>
