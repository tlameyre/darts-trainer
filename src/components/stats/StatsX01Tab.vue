<script setup>
import { computed } from 'vue'
import { STATS_MODE_COLORS } from '../../data/statsModes.js'
import AppIcon from '../AppIcon.vue'
import StatsHero from './StatsHero.vue'
import StatsHistory from './StatsHistory.vue'
import StatsHistoryCard from './StatsHistoryCard.vue'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
})

const emit = defineEmits(['open-detail'])

const COLOR = STATS_MODE_COLORS.x01

const summary = computed(() => {
  const s = props.sessions
  if (!s.length) return null

  const totalDoublesHit = s.reduce((acc, r) => acc + (r.doubles_hit ?? 0), 0)
  const totalDoublesAttempted = s.reduce((acc, r) => acc + (r.doubles_attempted ?? 0), 0)
  // Tournament matches lost without throwing a dart have no averages
  const thrown = s.filter(r => r.avg_volley != null)

  return {
    sessions: s.length,
    avgVolley: thrown.length ? (thrown.reduce((acc, r) => acc + Number(r.avg_volley), 0) / thrown.length).toFixed(2) : '—',
    avg9darts: thrown.length ? (thrown.reduce((acc, r) => acc + Number(r.avg_9darts), 0) / thrown.length).toFixed(2) : '—',
    pctFinish: totalDoublesAttempted > 0
      ? (totalDoublesHit / totalDoublesAttempted * 100).toFixed(2) + '%'
      : '—',
    avgDartsToFinish: (s.reduce((acc, r) => acc + Number(r.avg_darts_to_finish), 0) / s.length).toFixed(2),
    avgHighestFinish: Math.round(s.reduce((acc, r) => acc + (r.highest_finish ?? 0), 0) / s.length),
  }
})

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function fmtAvg(v) {
  return v != null ? Number(v).toFixed(2) : '–'
}

// Rows shown on a history card: the human, the DartBot if any, then human opponents
function players(s) {
  const toWin = s.settings?.legsToWin ?? 0
  const rows = [{
    name: s.settings?.humanName ?? 'Joueur',
    legs: s.settings?.humanLegsWon ?? '–',
    avg: fmtAvg(s.avg_volley),
    won: s.settings?.humanLegsWon != null && s.settings.humanLegsWon >= toWin,
  }]
  if (s.settings?.aiProfile) {
    rows.push({
      name: 'Dartbot',
      legs: s.settings?.aiLegsWon ?? '–',
      avg: fmtAvg(s.settings?.aiAvgVolley),
      won: s.settings?.aiLegsWon != null && s.settings.aiLegsWon >= toWin,
    })
  }
  for (const opp of s.settings?.opponents ?? []) {
    rows.push({ name: opp.name, legs: opp.legsWon, avg: fmtAvg(opp.avgVolley), won: opp.legsWon >= toWin })
  }
  return rows
}
</script>

<template>
  <StatsHero
    v-if="summary"
    label="Moyenne volée" :value="summary.avgVolley"
    :badge-value="summary.sessions" badge-label="parties"
    :metrics="[
      { value: summary.avg9darts, label: 'Moy. 9 premières' },
      { value: summary.pctFinish, label: '% de finish' },
      { value: summary.avgHighestFinish, label: 'Finish moyen' },
      { value: summary.avgDartsToFinish, label: 'Fléch. / leg' },
    ]"
    :color="COLOR"
  />

  <StatsHistory :count="sessions.length" unit="parties"
    empty-text="Lance une partie x01 pour voir tes stats ici.">
    <StatsHistoryCard
      v-for="s in sessions" :key="s.id"
      :title="`${s.start_score} · ${s.legs_played} manche${s.legs_played > 1 ? 's' : ''}`"
      :date="formatDate(s.played_at)" :color="COLOR"
      @click="emit('open-detail', s)"
    >
      <span v-if="s.tournament_id" class="tab__badge">
        <AppIcon name="trophy" :width="12" :height="12" />
        {{ s.tournaments?.name ?? 'Tournoi' }}
      </span>
      <div class="tab__players">
        <div v-for="p in players(s)" :key="p.name" class="tab__player" :class="{ 'tab__player--winner': p.won }">
          <span class="tab__player-name">{{ p.name }}</span>
          <AppIcon v-if="p.won" name="trophy" :width="16" :height="16" class="tab__player-trophy" />
          <span v-else />
          <span class="tab__player-legs">{{ p.legs }}</span>
          <span class="tab__player-avg">{{ p.avg }}</span>
        </div>
      </div>
    </StatsHistoryCard>
  </StatsHistory>
</template>

<style lang="scss" scoped>
.tab {
  &__badge {
    display: flex;
    align-items: center;
    align-self: flex-start;
    gap: $gap-xxs;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-pill;
    background: rgba($orange, 0.15);
    color: $orange-dark;
    @include text-xxs;
  }

  &__players {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__player {
    display: grid;
    grid-template-columns: 1fr 20px 32px 56px;
    align-items: center;
    gap: $gap-xs;
    @include title-md;
    color: $muted;

    &--winner { color: $text-color; }
  }

  &__player-trophy { color: $accent; }

  &__player-legs {
    justify-self: center;
    min-width: 24px;
    padding: 1px $padding-xs;
    border-radius: $radius-sm;
    background: $bg;
    text-align: center;
    color: $text-color;
    @include title-sm;
  }

  &__player--winner &__player-legs {
    background: $accent;
    color: $white;
  }

  &__player-avg {
    justify-self: end;
    font-variant-numeric: tabular-nums;
  }
}

@media (min-width: $bp-laptop) {
  .tab {
    &__badge  { @include text-xs; }
    &__player { @include title-lg; }
    &__player-legs { @include title-md; }
  }
}
</style>
