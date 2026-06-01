<script setup>
defineProps({
  // Couleur de fond de la carte (vert X01, bleu échauffement…)
  color: { type: String, required: true },
  // Lignes label / valeur affichées sous l'en-tête
  rows: { type: Array, default: () => [] }, // [{ label, value }]
})
</script>

<template>
  <div class="stats-card" :style="{ background: color }">
    <div class="stats-card__header">
      <slot />
    </div>
    <div class="stats-card__rows">
      <div v-for="(row, i) in rows" :key="i" class="stats-card__row">
        <span class="stats-card__label">{{ row.label }}</span>
        <span class="stats-card__value">{{ row.value }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stats-card {
  border-radius: $radius-lg;
  padding: $padding-md;
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  flex-shrink: 0;

  &__header {
    @include title-xxxl;
    font-weight: 700;
    color: $white;
    line-height: 1;
    text-align: center;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-variant-numeric: tabular-nums;
    transition: color 0.3s;
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

@media (min-width: $bp-laptop) {
  .stats-card {
    padding: $padding-lg;
    gap: $gap-sm;

    &__label { @include text-md; }
    &__value { @include title-md; }
  }
}
</style>
