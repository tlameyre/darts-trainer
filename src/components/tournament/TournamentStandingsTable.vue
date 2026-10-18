<script setup>
import { computed } from 'vue'
import { computeStandings } from '../../composables/useChampionship.js'

const props = defineProps({
  matches:      { type: Array, required: true },
  participants: { type: Array, required: true },
  playoffSize:  { type: Number, default: null },
  myUserId:     { type: String, default: null },
})

const standings = computed(() => computeStandings(props.matches, props.participants))

function formatDiff(diff) {
  return diff > 0 ? `+${diff}` : `${diff}`
}
</script>

<template>
  <div class="standings">
    <table class="standings__table">
      <thead>
        <tr>
          <th class="standings__rank">#</th>
          <th class="standings__name">Joueur</th>
          <th>J</th>
          <th>V</th>
          <th>D</th>
          <th>+/-</th>
          <th class="standings__points">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in standings" :key="row.participant.id"
          class="standings__row"
          :class="{
            'standings__row--qualified': playoffSize && row.rank <= playoffSize,
            'standings__row--cutoff':    playoffSize && row.rank === playoffSize,
            'standings__row--me':        myUserId && row.participant.user_id === myUserId,
          }"
        >
          <td class="standings__rank">{{ row.rank }}</td>
          <td class="standings__name">{{ row.participant.player_data?.name }}</td>
          <td>{{ row.played }}</td>
          <td>{{ row.wins }}</td>
          <td>{{ row.losses }}</td>
          <td>{{ formatDiff(row.legDiff) }}</td>
          <td class="standings__points">{{ row.points }}</td>
        </tr>
      </tbody>
    </table>
    <p class="standings__legend">
      Victoire = 2 pts. Départage : différence de manches, manches gagnées, confrontations directes.
      <template v-if="playoffSize"> Les {{ playoffSize }} premiers se qualifient pour les playoffs.</template>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.standings {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__table {
    width: 100%;
    border-collapse: collapse;
    @include text-sm;
    color: $text-color;
    font-variant-numeric: tabular-nums;

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

  &__rank {
    width: 28px;
    color: $muted;
  }

  &__name {
    text-align: left !important;
    max-width: 0;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__points {
    @include title-sm;
    color: $white;
  }

  &__row {
    &--qualified .standings__rank { color: $orange; }

    &--cutoff td { border-bottom: $border-md dashed rgba($orange, 0.5); }

    &--me { background: rgba($white, 0.04); }
  }

  &__legend {
    @include text-xs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .standings {
    &__table    { @include text-md; }
    &__table th { @include text-sm; }
    &__points   { @include title-md; }
    &__legend   { @include text-sm; }
  }
}
</style>
