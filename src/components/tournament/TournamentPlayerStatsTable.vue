<script setup>
import { ref, computed } from 'vue'
import { aggregatePlayerStats } from '../../composables/useTournamentStats.js'
import { avatarColor } from '../../utils/avatarColor.js'

const props = defineProps({
  sessions:     { type: Array,  required: true }, // get_tournament_player_sessions()
  participants: { type: Array,  required: true },
  myUserId:     { type: String, default: null },
})

const formatAvg = v => (v == null ? '–' : v.toFixed(2))

// lowerIsBetter : la meilleure manche se compte en fléchettes
const COLUMNS = [
  { key: 'matches',       label: 'M' },
  { key: 'average',       label: 'Moy',    format: formatAvg },
  { key: 'first9Average', label: '9 prem', format: formatAvg },
  { key: 'checkoutPct',   label: 'Ferm.',  format: v => (v == null ? '–' : `${Math.round(v)}%`) },
  { key: 'highestFinish', label: 'Finish' },
  { key: 'bestLeg',       label: 'Manche', format: v => (v == null ? '–' : `${v} fl.`), lowerIsBetter: true },
  { key: 'highestVolley', label: 'Volée' },
]

const sortKey = ref('average')

const rows = computed(() => {
  const col = COLUMNS.find(c => c.key === sortKey.value)
  // Sans valeur : toujours en bas, quel que soit le sens du tri
  return aggregatePlayerStats(props.sessions, props.participants).sort((a, b) => {
    const va = a[col.key] ?? null
    const vb = b[col.key] ?? null
    if (va == null || vb == null) return (va == null) - (vb == null)
    return col.lowerIsBetter ? va - vb : vb - va
  })
})

// Best value of a column among all players, for the summary tiles
function leader(key) {
  const best = rows.value.filter(r => r[key] != null).sort((a, b) => b[key] - a[key])[0]
  return best ? { name: best.participant.player_data?.name, value: best[key] } : null
}

const highlights = computed(() => [
  { label: 'Meilleure moy.',   leader: leader('average'),       format: formatAvg },
  { label: 'Plus haut finish', leader: leader('highestFinish'), format: v => v },
  { label: 'Doubles',          leader: leader('checkoutPct'),   format: v => `${Math.round(v)} %` },
].filter(h => h.leader))

function cell(row, col) {
  const v = row[col.key] ?? null
  return col.format ? col.format(v) : (v ?? '–')
}
</script>

<template>
  <div class="player-stats">
    <div v-if="highlights.length" class="player-stats__highlights">
      <div v-for="h in highlights" :key="h.label" class="player-stats__highlight">
        <span class="player-stats__highlight-label">{{ h.label }}</span>
        <span class="player-stats__highlight-value">{{ h.format(h.leader.value) }}</span>
        <span class="player-stats__highlight-name">
          <span class="player-stats__avatar" :style="{ background: avatarColor(h.leader.name) }">{{ h.leader.name?.[0] }}</span>
          {{ h.leader.name }}
        </span>
      </div>
    </div>
    <div class="player-stats__scroll">
      <table class="player-stats__table">
        <thead>
          <tr>
            <th class="player-stats__name">Joueur</th>
            <th
              v-for="col in COLUMNS" :key="col.key"
              class="player-stats__sortable"
              :class="{ 'player-stats__sortable--active': sortKey === col.key }"
              @click="sortKey = col.key"
            >{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows" :key="row.participant.id"
            :class="{ 'player-stats__row--me': myUserId && row.participant.user_id === myUserId }"
          >
            <td class="player-stats__name">
              <span class="player-stats__avatar" :style="{ background: avatarColor(row.participant.player_data?.name) }">{{ row.participant.player_data?.name?.[0] }}</span>
              {{ row.participant.player_data?.name }}
            </td>
            <td
              v-for="col in COLUMNS" :key="col.key"
              :class="{ 'player-stats__value--active': sortKey === col.key }"
            >{{ cell(row, col) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="player-stats__legend">
      Cumul sur tous les matchs joués du tournoi. M : matchs, Ferm. : doubles réussis, Manche : meilleure manche en fléchettes.
      Touche un en-tête pour trier.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.player-stats {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__highlights {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__highlight {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__highlight-label {
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $muted;
  }

  &__highlight-value {
    @include title-xxl;
    line-height: 0.9;
    white-space: nowrap;
  }

  &__highlight-name {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    @include text-xs;
    min-width: 0;
  }

  &__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    margin-right: $gap-xxs;
    border-radius: $radius-pill;
    color: $white;
    @include title-xxs;
  }

  &__highlight-name &__avatar {
    width: 18px;
    height: 18px;
    margin: 0;
  }

  &__scroll {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 $gap-xxs;
    @include text-sm;
    color: $text-color;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    th {
      @include text-xxs;
      font-weight: 600;
      color: $muted;
      text-transform: uppercase;
      letter-spacing: $tracking-sm;
      padding: 0 $padding-xs $padding-xxs;
      text-align: right;
    }

    td {
      padding: $padding-xs;
      text-align: right;
      background: $surface;

      &:first-child { border-radius: $radius-sm 0 0 $radius-sm; }
      &:last-child  { border-radius: 0 $radius-sm $radius-sm 0; }
    }
  }

  // Colonne Joueur fixe pendant le scroll horizontal
  &__name {
    position: sticky;
    left: 0;
    z-index: 1;
    text-align: left !important;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    @include title-md;
  }

  &__sortable {
    cursor: pointer;
    user-select: none;

    &--active { color: $mode-tournament !important; }
  }

  &__value--active {
    @include title-md;
    color: $mode-tournament;
  }

  &__row--me td { background: $white; }

  &__legend {
    @include text-xs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .player-stats {
    &__highlight-label { @include text-xs; }
    &__highlight-value { @include display-xs; }
    &__highlight-name  { @include text-sm; }
    &__table          { @include text-md; }
    &__table th       { @include text-xs; }
    &__name           { @include title-lg; }
    &__value--active  { @include title-lg; }
    &__legend         { @include text-sm; }
  }
}
</style>
