<script setup>
import { computed } from 'vue'
import GameRecap from '../game/GameRecap.vue'
import ScoreRecapRow from './ScoreRecapRow.vue'
import { formatDuration } from '../../utils/formatDuration.js'

const props = defineProps({
  history: { type: Array, required: true },
  doubleValidation: Boolean,
  best: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  hideActions: Boolean,
})

defineEmits(['replay', 'home'])

// A question finished mid-way (via "Terminer la partie") was never answered
const entries = computed(() => props.history.filter(e => e.answer !== undefined))

const score = computed(() => {
  const voleeOk = entries.value.filter(e => e.answer === e.total).length
  if (!props.doubleValidation) return { correct: voleeOk, total: entries.value.length }
  const played = entries.value.filter(e => e.phase2Played && e.remainingAnswer !== undefined)
  const remainingOk = played.filter(e => e.remainingAnswer === e.remaining).length
  return { correct: voleeOk + remainingOk, total: entries.value.length + played.length }
})

const percent = computed(() =>
  score.value.total ? Math.round((score.value.correct / score.value.total) * 100) : 0
)

const stats = computed(() => [
  { label: 'Temps total', value: formatDuration(props.durationMs) },
  { label: 'Meilleure série', value: props.best },
])

const countLabel = computed(() => {
  const n = entries.value.length
  const label = `${n} question${n > 1 ? 's' : ''}`
  return props.doubleValidation ? `${label} · 2 étapes` : label
})
</script>

<template>
  <GameRecap
    :percent="percent"
    :badge-value="`${score.correct}/${score.total}`"
    badge-label="bonnes réponses"
    :stats="stats"
    :hide-actions="hideActions"
    list-title="Récap par question"
    :list-count="countLabel"
    @primary="$emit('replay')"
    @home="$emit('home')"
  >
    <ScoreRecapRow
      v-for="(entry, i) in entries"
      :key="i"
      :index="i + 1"
      :entry="entry"
      :double-validation="doubleValidation"
    />
  </GameRecap>
</template>
