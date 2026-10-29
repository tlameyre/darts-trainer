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
  <GameStatCard class="quiz-panel" title="Reste à finir" :value="score ?? ''" :rows="rows" compact large>
    <template v-if="tag" #badge>
      <span class="quiz-panel__tag">{{ tag }}</span>
    </template>
  </GameStatCard>
</template>

<style lang="scss" scoped>
.quiz-panel {
  flex: 1;
  margin: $padding-xs $padding-md $padding-md;

  &__tag {
    @include title-sm;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: var(--game-tone, var(--tone));
    color: $white;
    white-space: nowrap;
  }
}

@media (min-width: $bp-laptop) {
  .quiz-panel {
    margin: 0;

    &__tag { @include title-lg; padding: $padding-xxs $padding-sm; }
  }
}
</style>
