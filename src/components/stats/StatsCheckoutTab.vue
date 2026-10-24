<script setup>
import { computed } from 'vue'
import { STATS_MODE_COLORS } from '../../data/statsModes.js'
import StatsHero from './StatsHero.vue'
import StatsHistory from './StatsHistory.vue'
import StatsHistoryCard from './StatsHistoryCard.vue'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
})

const emit = defineEmits(['open-detail'])

const COLOR = STATS_MODE_COLORS.checkout

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

const summary = computed(() => {
  if (!props.sessions.length) return null
  const totalQ = props.sessions.reduce((s, r) => s + r.questions, 0)
  const totalC = props.sessions.reduce((s, r) => s + r.correct_count, 0)
  return {
    sessions: props.sessions.length,
    rate: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
    bestStreak: Math.max(...props.sessions.map((r) => r.best_streak ?? 0)),
  }
})
</script>

<template>
  <StatsHero
    v-if="summary"
    label="Réussite" :value="summary.rate" unit="%"
    :badge-value="summary.sessions" badge-label="sessions"
    :metrics="[{ value: summary.bestStreak, label: 'Meilleure série' }]"
    :color="COLOR"
  />

  <StatsHistory :count="sessions.length" unit="quiz"
    empty-text="Lance un quiz Checkouts pour voir tes stats ici.">
    <StatsHistoryCard
      v-for="s in sessions" :key="s.id"
      :title="`Quiz ${s.questions} checkouts`" :date="formatDate(s.played_at)" :color="COLOR"
      :metrics="[
        { label: 'Réussite', value: `${s.correct_count}/${s.questions}` },
        { label: 'Recommandées', value: s.optimal_count },
        { label: 'Points', value: s.points },
      ]"
      @click="emit('open-detail', s)"
    />
  </StatsHistory>
</template>
