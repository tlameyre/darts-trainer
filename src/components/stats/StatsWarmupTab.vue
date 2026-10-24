<script setup>
import { STATS_MODE_COLORS } from '../../data/statsModes.js'
import { formatZoneLabel, formatZonesLabel } from '../../composables/useWarmup.js'
import AppIcon from '../AppIcon.vue'
import StatsHero from './StatsHero.vue'
import StatsHistory from './StatsHistory.vue'
import StatsHistoryCard from './StatsHistoryCard.vue'

defineProps({
  summary:  { type: Object, default: null },
  sessions: { type: Array,  default: () => [] },
})

const emit = defineEmits(['open-detail', 'open-chart'])

const COLOR = STATS_MODE_COLORS.warmup

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function zoneCount(s) {
  return s.settings?.zoneRecap?.length ?? 1
}

function zoneNames(s) {
  if (s.settings?.zoneRecap?.length) {
    return s.settings.zoneRecap.map(z =>
      z.zones ? formatZonesLabel(z.zones) : formatZoneLabel(z.zone)
    ).join(', ')
  }
  return s.zone ?? '—'
}
</script>

<template>
  <StatsHero
    v-if="summary"
    label="Précision" :value="summary.avgAccuracy" unit="%"
    :badge-value="summary.sessions" badge-label="sessions"
    :metrics="[{ value: summary.totalDarts, label: 'Fléchettes jetées' }]"
    :color="COLOR"
  >
    <button class="tab__detail-btn" @click="emit('open-chart')">
      Voir le détail
      <AppIcon name="arrow-right" :width="16" :height="16" />
    </button>
  </StatsHero>

  <StatsHistory :count="sessions.length" unit="dernières sessions"
    empty-text="Lance une session d'échauffement pour voir tes stats ici.">
    <StatsHistoryCard
      v-for="s in sessions" :key="s.id"
      :title="`${zoneCount(s)} zone${zoneCount(s) > 1 ? 's' : ''}`" :date="formatDate(s.played_at)" :color="COLOR"
      :metrics="[
        { label: 'Zones', value: zoneNames(s) },
        { label: 'Précision', value: `${s.accuracy} %` },
        { label: 'Fléchettes', value: s.total_darts },
      ]"
      @click="emit('open-detail', s)"
    />
  </StatsHistory>
</template>

<style lang="scss" scoped>
.tab__detail-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: $padding-sm;
  border-top: $border-md solid rgba($white, 0.3);
  @include title-md;
  text-transform: uppercase;
  color: $white;
}

@media (min-width: $bp-laptop) {
  .tab__detail-btn { @include title-lg; }
}
</style>
