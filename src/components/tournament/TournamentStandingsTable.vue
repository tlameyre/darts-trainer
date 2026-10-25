<script setup>
import { computed } from 'vue'
import { computeStandings } from '../../composables/useChampionship.js'
import { avatarColor } from '../../utils/avatarColor.js'

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
    <div class="standings__grid standings__head">
      <span>#</span><span>Joueur</span><span>J</span><span>V</span><span>D</span><span><span class="standings__sm">+/-</span><span class="standings__lg">Manches +/-</span></span><span class="standings__right"><span class="standings__sm">Pts</span><span class="standings__lg">Points</span></span>
    </div>
    <template v-for="row in standings" :key="row.participant.id">
      <div
        class="standings__grid standings__row"
        :class="{
          'standings__row--qualified': playoffSize && row.rank <= playoffSize,
          'standings__row--out':       playoffSize && row.rank > playoffSize,
          'standings__row--me':        myUserId && row.participant.user_id === myUserId,
        }"
      >
        <span class="standings__rank">{{ row.rank }}</span>
        <span class="standings__player">
          <span class="standings__avatar" :style="{ background: avatarColor(row.participant.player_data?.name) }">{{ row.participant.player_data?.name?.[0] }}</span>
          <span class="standings__name">{{ row.participant.player_data?.name }}</span>
        </span>
        <span>{{ row.played }}</span>
        <span>{{ row.wins }}</span>
        <span>{{ row.losses }}</span>
        <span :class="row.legDiff > 0 ? 'standings__diff--pos' : row.legDiff < 0 ? 'standings__diff--neg' : ''">{{ formatDiff(row.legDiff) }}</span>
        <span class="standings__right standings__points">{{ row.points }}</span>
      </div>
      <div v-if="playoffSize && row.rank === playoffSize" class="standings__cutoff">
        <span /><span>Qualifiés playoffs</span><span />
      </div>
    </template>
    <p class="standings__legend">
      Victoire = 2 pts. Départage : différence de manches, manches gagnées, confrontations directes.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.standings {
  display: flex;
  flex-direction: column;
  gap: $gap-xxs;

  &__grid {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) 28px 28px 28px 38px 44px;
    gap: 6px;
    align-items: center;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  &__head {
    padding: 0 $padding-xs $padding-xxs;
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $muted;
  }

  &__row {
    min-height: 48px;
    padding: 0 $padding-xs;
    border-radius: $radius-sm;
    @include text-sm;
    color: $text-color;

    &--qualified { background: $surface; }
    &--me { background: $white; box-shadow: inset 0 0 0 $border-md $mode-tournament; }
  }

  &__right { text-align: right; }

  &__lg { display: none; }

  &__rank {
    @include title-md;
    color: $muted;

    .standings__row--qualified & { color: $mode-tournament; }
  }

  &__player {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    min-width: 0;
    text-align: left;
  }

  &__avatar {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: $radius-pill;
    color: $white;
    @include title-xxs;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    @include title-sm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__diff--pos { color: $accent; }
  &__diff--neg { color: $error; }

  &__points { @include title-lg; }

  &__cutoff {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    margin-bottom: $gap-sm;
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $mode-tournament;

    span:first-child,
    span:last-child {
      flex: 1;
      border-top: $border-md dashed $mode-tournament;
    }
  }

  &__legend {
    margin-top: $gap-sm;
    @include text-xs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .standings {
    &__sm { display: none; }
    &__lg { display: inline; }
    &__grid { grid-template-columns: 48px minmax(0, 1fr) 56px 56px 56px 80px 240px; gap: $gap-sm; }
    &__head { padding: 0 $padding-md $padding-xs; @include text-xs; }
    &__row { height: 50px; min-height: 0; padding: 0 $padding-md; @include text-md; }
    &__name { @include title-lg; }
    &__rank { @include title-xxl; }
    &__points { @include title-xxl; }
    &__avatar { width: 30px; height: 30px; }
    &__cutoff { @include text-xs; }
    &__legend { @include text-sm; }
  }
}
</style>
