<script setup>
import { computed } from 'vue'

const props = defineProps({
  remaining:    { type: Number, required: true },
  legNumber:    { type: Number, required: true },
  legsToWin:    { type: Number, required: true },
  volleyNumber: { type: Number, required: true },
  volleys:      { type: Array,  required: true }, // volées de la manche en cours
  currentDarts: { type: Array,  required: true }, // fléchettes de la volée courante
})

/** Total de fléchettes lancées dans la manche (y compris volée courante) */
const totalDarts = computed(() =>
  props.volleys.reduce((sum, v) => sum + v.darts.length, 0) + props.currentDarts.length
)

/** Moyenne des volées valides de la manche courante */
const avgVolley = computed(() => {
  const valid = props.volleys.filter(v => !v.bust)
  if (!valid.length) return '–'
  const avg = Math.round(valid.reduce((s, v) => s + v.score, 0) / valid.length)
  return avg
})

/** Score restant coloré selon la zone de checkout */
const remainingColor = computed(() => {
  if (props.remaining <= 40)  return '#36cc86'   // checkout facile
  if (props.remaining <= 170) return '#f59e0b'   // checkout possible
  return '#ffffff'
})
</script>

<template>
  <div class="stats-card">
    <div class="stats-card__score" :style="{ color: remainingColor }">
      {{ remaining }}
    </div>
    <div class="stats-card__rows">
      <div class="stats-card__row">
        <span class="stats-card__label">Manche</span>
        <span class="stats-card__value">{{ Math.min(legNumber, legsToWin) }} / {{ legsToWin }}</span>
      </div>
      <div class="stats-card__row">
        <span class="stats-card__label">Fléchettes lancées</span>
        <span class="stats-card__value">{{ totalDarts }}</span>
      </div>
      <div class="stats-card__row">
        <span class="stats-card__label">Moy. volée</span>
        <span class="stats-card__value">{{ avgVolley }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stats-card {
  background: #047857;
  border-radius: $radius-lg;
  padding: $padding-md;
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  flex-shrink: 0;
  flex: 1;

  &__score {
    font-family: $font-title;
    font-weight: 700;
    font-size: $title-xxxl;
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

@media (min-width: $bp-tablet) {
  .stats-card {
    &__label  { @include text-lg; }
    &__value  { @include title-lg; }
  }
}
</style>
