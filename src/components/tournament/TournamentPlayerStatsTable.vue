<script setup>
import { ref, computed } from 'vue'
import { aggregatePlayerStats } from '../../composables/useTournamentStats.js'

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

function cell(row, col) {
  const v = row[col.key] ?? null
  return col.format ? col.format(v) : (v ?? '–')
}
</script>

<template>
  <div class="player-stats">
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
            <td class="player-stats__name">{{ row.participant.player_data?.name }}</td>
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

  &__scroll {
    overflow-x: auto;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    @include text-sm;
    color: $text-color;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    th {
      @include text-xs;
      color: $muted;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: $padding-xs;
      text-align: center;
    }

    td {
      padding: $padding-sm $padding-xs;
      text-align: center;
      border-top: $border-sm solid rgba($white, 0.08);
    }
  }

  // Colonne Joueur fixe pendant le scroll horizontal
  &__name {
    position: sticky;
    left: 0;
    z-index: 1;
    background: $bg;
    text-align: left !important;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__sortable {
    cursor: pointer;
    user-select: none;

    &--active { color: $orange !important; }
  }

  &__value--active {
    @include title-sm;
    color: $white;
  }

  &__row--me td { background: rgba($white, 0.04); }
  &__row--me &__name { background: mix($white, $bg, 4%); }

  &__legend {
    @include text-xs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .player-stats {
    &__table          { @include text-md; }
    &__table th       { @include text-sm; }
    &__value--active  { @include title-md; }
    &__legend         { @include text-sm; }
  }
}
</style>
