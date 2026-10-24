<script setup>
import { computed } from 'vue'
import { STATS_MODE_COLORS } from '../../data/statsModes.js'
import StatsHero from './StatsHero.vue'
import StatsHistory from './StatsHistory.vue'
import StatsHistoryCard from './StatsHistoryCard.vue'

const props = defineProps({
  summary:  { type: Object, default: null },
  sessions: { type: Array,  default: () => [] },
})

const emit = defineEmits(['open-detail'])

const COLOR = STATS_MODE_COLORS.score

const rate = computed(() => {
  const s = props.summary
  return s && s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0
})

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <StatsHero
    v-if="summary"
    label="Réussite" :value="rate" unit="%"
    :badge-value="summary.sessions" badge-label="sessions"
    :metrics="[{ value: summary.bestStreak, label: 'Meilleure série' }]"
    :color="COLOR"
  />

  <StatsHistory :count="sessions.length" unit="sessions"
    empty-text="Lance une partie Score Training pour voir tes stats ici.">
    <StatsHistoryCard
      v-for="s in sessions" :key="s.id"
      :title="`${s.total_questions} questions`" :date="formatDate(s.played_at)" :color="COLOR"
      :metrics="[
        { label: 'Score', value: `${s.correct_count}/${s.total_questions}` },
        { label: 'Série', value: s.best_streak },
      ]"
      @click="emit('open-detail', s)"
    />
  </StatsHistory>
</template>
