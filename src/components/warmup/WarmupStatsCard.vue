<script setup>
import { formatZoneLabel } from '../../composables/useWarmup.js'

defineProps({
  zone: { type: Object, required: true },
  stats: { type: Object, required: true },
})
</script>

<template>
  <div class="stats-card">
    <div class="stats-card__zone">{{ formatZoneLabel(zone) }}</div>
    <div class="stats-card__rows">
      <div class="stats-card__row">
        <span class="stats-card__label">Fléchettes jetées</span>
        <span class="stats-card__value">{{ stats.total }}</span>
      </div>
      <div class="stats-card__row">
        <span class="stats-card__label">Fléchettes touchées</span>
        <span class="stats-card__value">{{ stats.hits }}</span>
      </div>
      <div class="stats-card__row">
        <span class="stats-card__label">Taux de réussite</span>
        <span class="stats-card__value">{{ stats.accuracy }}%</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stats-card {
  background: $blue;
  border-radius: $radius-lg;
  padding: $padding-md;
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  flex-shrink: 0;
  flex: 1;

  &__zone {
    @include title-xxxl;
    color: $white;
    line-height: 1;
    text-align: center;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    @include text-sm;
    color: rgba($white, 0.75);
  }

  &__value {
    @include title-sm;
    color: $white;
    font-variant-numeric: tabular-nums;
  }
}

@media (min-width: $bp-tablet) {
  .stats-card {
    &__label {
      @include text-lg;
    }

    &__value {
      @include title-lg;
    }
  }
}
</style>
