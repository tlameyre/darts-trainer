<script setup>
import { computed } from 'vue'
import GameStatCard from '../game/GameStatCard.vue'
import { bracketOf } from '../../composables/useCheckouts.js'

const props = defineProps({
  score: { type: Number, default: null },
  result: { type: Object, default: null }, // from describeResult
  progress: { type: Object, required: true }, // { index, total }
  points: { type: Number, default: 0 },
})

const bracket = computed(() => bracketOf(props.score))

const rows = computed(() => {
  const { index, total } = props.progress
  return [
    { label: 'Question', value: Number.isFinite(total) ? `${index + 1} / ${total}` : index + 1 },
    { label: 'Points', value: `${props.points} pts` },
    ...(bracket.value
      ? [
          { label: 'Tranche', value: bracket.value.label },
          { label: 'Valeur', value: `${bracket.value.points} pt${bracket.value.points > 1 ? 's' : ''}` },
        ]
      : []),
  ]
})

const tag = computed(() => {
  if (props.result) return `${props.result.title} · ${props.result.pts}`
  return bracket.value ? `${bracket.value.label} · ${bracket.value.points} pt${bracket.value.points > 1 ? 's' : ''}` : null
})
</script>

<template>
  <div class="quiz-panel">
    <div class="quiz-panel__band">
      <span class="quiz-panel__band-score">
        <span class="quiz-panel__kicker">Reste à finir</span>
        <span class="quiz-panel__band-value">{{ score }}</span>
      </span>
      <span v-if="tag" class="quiz-panel__band-tag">{{ tag }}</span>
    </div>

    <GameStatCard class="quiz-panel__card" title="Reste à finir" :value="score ?? ''" :rows="rows" large>
      <template v-if="tag" #badge>
        <span class="quiz-panel__tag">{{ tag }}</span>
      </template>
    </GameStatCard>
  </div>
</template>

<style lang="scss" scoped>
// Mobile: a colored band; desktop: the stat card on the colored panel
.quiz-panel {
  flex: 1;
  display: flex;
  flex-direction: column;

  &__band {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    margin: 0 $padding-md;
    padding: $padding-sm $padding-md;
    border-radius: $radius-sm;
    background: var(--game-tone, var(--tone));
    color: $white;
    transition: background 0.2s;
  }

  &__band-score {
    display: flex;
    flex-direction: column;
  }

  &__kicker {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.8;
  }

  &__band-value {
    @include display-xs;
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
  }

  &__band-tag {
    @include title-sm;
    margin-left: auto;
    padding: 2px $padding-xs;
    border-radius: $radius-sm;
    background: rgba($white, 0.2);
    white-space: nowrap;
  }

  &__card { display: none; }

  &__tag {
    @include title-lg;
    padding: $padding-xxs $padding-sm;
    border-radius: $radius-sm;
    background: var(--game-tone, var(--tone));
    color: $white;
    white-space: nowrap;
  }
}

@media (min-width: $bp-laptop) {
  .quiz-panel {
    &__band { display: none; }
    &__card { display: flex; flex: 1; }
  }
}
</style>
