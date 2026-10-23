<script setup>
import { computed } from 'vue'
import { checkoutPct } from '../../composables/useX01MatchStats.js'

// One stats table: whole match (leg = null) or a single leg of buildMatchStats()
const props = defineProps({
  players: { type: Array,  required: true }, // players
  stats:   { type: Array,  required: true }, // matchStats.match or leg.players
  leg:     { type: Object, default: null },  // matchStats.legs[n]
})

const legWinnerName = computed(() => props.players[props.leg?.winnerIndex]?.name ?? null)

function formatAvg(v) {
  return v == null ? '–' : v.toFixed(2)
}

// better: 'high' | 'low' → highlights the best value of the row; omitted = no highlight
const MATCH_ROWS = [
  { label: 'Manches gagnées',  value: s => s.legsWon,        better: 'high' },
  { label: 'Moyenne',          value: s => s.average,        better: 'high', format: formatAvg },
  { label: 'Marquage',         value: s => s.scoringAverage, better: 'high', format: formatAvg },
  { label: 'Moy. 9 premières', value: s => s.first9Average,  better: 'high', format: formatAvg },
  { label: 'Fermeture',        value: checkoutPct,           better: 'high', format: v => (v == null ? '–' : `${v}%`) },
  { label: 'Taux de fermeture', value: s => (s.checkoutAttempts == null ? null : `${s.checkoutHits} / ${s.checkoutAttempts}`) },
  { label: 'Meilleur finish',  value: s => s.highestFinish,  better: 'high' },
  { label: 'Lancers',          value: s => s.darts },
  { label: 'Meilleure manche', value: s => s.bestLeg,        better: 'low', format: v => (v == null ? '–' : `${v} fl.`) },
]

const LEG_ROWS = MATCH_ROWS
  .filter(r => !['Manches gagnées', 'Meilleure manche'].includes(r.label))
  .map(r => (r.label === 'Meilleur finish' ? { ...r, label: 'Finish' } : r))

const BUCKET_ROWS = [60, 80, 100, 140, 180].map(b => ({
  label: b === 180 ? '180' : `${b}+`,
  value: s => s.buckets?.[b] ?? null,
  better: 'high',
}))

function buildRows(defs) {
  return defs.map(def => {
    const raw = props.stats.map(def.value)
    const nums = raw.filter(v => typeof v === 'number')
    let best = null
    if (def.better && raw.length > 1 && nums.length > 1 && new Set(nums).size > 1) {
      best = def.better === 'high' ? Math.max(...nums) : Math.min(...nums)
    }
    return {
      label: def.label,
      cells: raw.map(v => ({
        text: def.format ? def.format(v) : (v ?? '–'),
        best: best != null && v === best,
      })),
    }
  })
}

const mainRows   = computed(() => buildRows(props.leg ? LEG_ROWS : MATCH_ROWS))
const bucketRows = computed(() => buildRows(BUCKET_ROWS))
</script>

<template>
  <div class="match-stats">
    <p v-if="leg" class="match-stats__caption">
      Leg {{ leg.number }}
      <template v-if="legWinnerName"> · gagnée par {{ legWinnerName }}</template>
      <template v-else> · non terminée</template>
    </p>

    <div class="match-stats__scroller">
      <table class="match-stats__table">
        <thead>
          <tr>
            <th class="match-stats__label" />
            <th
              v-for="(p, i) in players"
              :key="i"
              class="match-stats__player"
              :class="{ 'match-stats__player--me': p.isMe, 'match-stats__player--ai': p.isAI }"
            >{{ p.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th class="match-stats__section" :colspan="players.length + 1">Stats générales</th>
          </tr>
          <tr v-for="row in mainRows" :key="row.label">
            <th class="match-stats__label">{{ row.label }}</th>
            <td
              v-for="(cell, i) in row.cells"
              :key="i"
              class="match-stats__value"
              :class="{ 'match-stats__value--best': cell.best }"
            >{{ cell.text }}</td>
          </tr>
        </tbody>
        <tbody>
          <tr>
            <th class="match-stats__section" :colspan="players.length + 1">Scoring</th>
          </tr>
          <tr v-for="row in bucketRows" :key="row.label">
            <th class="match-stats__label">{{ row.label }}</th>
            <td
              v-for="(cell, i) in row.cells"
              :key="i"
              class="match-stats__value"
              :class="{ 'match-stats__value--best': cell.best }"
            >{{ cell.text }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.match-stats {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  min-width: 0;

  &__caption {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  &__scroller {
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__label {
    @include text-sm;
    color: $muted;
    text-align: left;
    white-space: nowrap;
    padding: $padding-xs $padding-sm $padding-xs 0;
    position: sticky;
    left: 0;
    background: $bg;
  }

  &__player {
    @include title-sm;
    color: $white;
    text-align: center;
    padding: $padding-xs;
    min-width: 72px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--me { color: $orange; }
    &--ai { color: $blue; }
  }

  &__value {
    @include title-md;
    color: $text-color;
    text-align: center;
    font-variant-numeric: tabular-nums;
    padding: $padding-xs;
    white-space: nowrap;

    &--best { color: $orange; }
  }

  &__section {
    @include title-sm;
    color: $muted;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: $padding-lg 0 $padding-xs;
    position: sticky;
    left: 0;
  }

  tbody:first-of-type &__section { padding-top: $padding-xs; }

  tbody tr + tr { border-top: $border-sm solid rgba($white, 0.06); }
}

@media (min-width: $bp-laptop) {
  .match-stats {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;

    &__caption { @include text-md; }
    &__section { @include title-sm; }
    &__label   { @include text-md; padding: $padding-sm $padding-md $padding-sm 0; }
    &__player  { @include title-md; min-width: 120px; max-width: 200px; }
    &__value   { @include title-lg; padding: $padding-sm; }
  }
}
</style>
