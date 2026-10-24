<script setup>
import { computed } from 'vue'
import StatCell from '../StatCell.vue'
import DartPill from '../checkout/DartPill.vue'
import { sameDart } from '../../composables/useCheckoutAnalysis.js'

const props = defineProps({
  analysis: { type: Object, required: true }, // sortie de analyzeLegs()
})

const GRADE_LABELS = {
  best:       'Meilleur',
  good:       'Bon',
  inaccuracy: 'Imprécis',
  mistake:    'Erreur',
}

const legs = computed(() => {
  const byLeg = new Map()
  for (const move of props.analysis.moves) {
    if (!byLeg.has(move.leg)) byLeg.set(move.leg, [])
    byLeg.get(move.leg).push(move)
  }
  return [...byLeg].map(([leg, moves]) => ({ leg, moves }))
})

const pctLabel = (pct) => (pct == null ? '–' : `${pct} %`)
</script>

<template>
  <div class="co-review">
    <div class="co-review__summary">
      <StatCell :value="pctLabel(analysis.placementPct)" label="Bons placements" highlight />
      <StatCell :value="pctLabel(analysis.executionPct)" label="Cible touchée" />
    </div>

    <div class="co-review__counts">
      <span
        v-for="(label, grade) in GRADE_LABELS"
        :key="grade"
        class="co-review__count"
        :class="`co-review__count--${grade}`"
      >
        {{ analysis.counts[grade] }} {{ label }}
      </span>
    </div>

    <div v-for="{ leg, moves } in legs" :key="leg" class="co-review__leg">
      <p class="co-review__leg-title">Manche {{ leg }}</p>

      <div v-for="(move, i) in moves" :key="i" class="co-review__move">
        <div class="co-review__line">
          <span class="co-review__remaining">
            {{ move.remaining }}
            <span class="co-review__darts-left">· {{ move.dartsLeft }} fl.</span>
          </span>
          <DartPill :dart="move.target" size="sm" />
          <span class="co-review__arrow">→</span>
          <DartPill v-if="move.hit.type !== 'miss'" :dart="move.hit" size="sm" />
          <span v-else class="co-review__miss">Raté</span>
          <span v-if="sameDart(move.hit, move.target)" class="co-review__on-target">✓</span>
          <span class="co-review__grade" :class="`co-review__grade--${move.grade}`">
            {{ GRADE_LABELS[move.grade] }}
          </span>
        </div>
        <p v-if="move.grade !== 'best'" class="co-review__reco">
          Recommandé : {{ move.recommended }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.co-review {
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-sm;
  }

  &__counts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $gap-xs;
  }

  &__count,
  &__grade {
    @include text-xs;
    padding: $padding-xxs $padding-sm;
    border-radius: $radius-pill;
    color: $white;

    &--best       { background: $accent-dark; }
    &--good       { background: $blue; }
    &--inaccuracy { background: $orange-dark; }
    &--mistake    { background: $error-dark; }
  }

  &__leg {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__leg-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
  }

  &__move {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__line {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__remaining {
    @include title-sm;
    color: $text-color;
    min-width: 72px;
  }

  &__darts-left,
  &__arrow,
  &__miss {
    @include text-xs;
    color: $muted;
  }

  &__on-target {
    @include text-sm;
    color: $accent;
  }

  &__grade { margin-left: auto; }

  &__reco {
    @include text-xs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .co-review {
    &__count,
    &__grade       { @include text-sm; }
    &__leg-title   { @include title-sm; }
    &__remaining   { @include title-md; }
    &__darts-left,
    &__arrow,
    &__miss,
    &__reco        { @include text-sm; }
    &__on-target   { @include text-md; }
  }
}
</style>
