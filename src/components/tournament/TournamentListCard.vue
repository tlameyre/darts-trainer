<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import { MIN_PARTICIPANTS_TO_START } from '../../data/tournamentConstants.js'

const props = defineProps({
  tournament: { type: Object, required: true },
})

defineEmits(['click'])

// player_count is only set at start: count the roster for pending tournaments
const playerCount = computed(() =>
  props.tournament.tournament_participants?.[0]?.count ?? props.tournament.player_count
)

const isPending = computed(() => props.tournament.status === 'pending')
const isLive    = computed(() => props.tournament.status === 'in_progress')

const FORMAT_LABELS = { bracket: 'Bracket', round_robin: 'Championnat', championship: 'Championnat' }

const meta = computed(() => {
  const t = props.tournament
  const parts = [FORMAT_LABELS[t.format] ?? 'Bracket']
  if (t.format === 'championship' && t.double_round_robin) parts.push('aller-retour')
  parts.push(String(t.start_score), `${t.legs_to_win} manche${t.legs_to_win > 1 ? 's' : ''}`)
  return parts.join(' · ')
})

const pct = (done, total) => (total ? Math.round((done / total) * 100) : 0)

// Progress shown under the title; matches are only embedded by the list query
const progress = computed(() => {
  const t       = props.tournament
  const matches = t.tournament_matches
  if (isPending.value) {
    return { percent: Math.min(100, pct(playerCount.value, MIN_PARTICIPANTS_TO_START)), label: `${playerCount.value} / ${MIN_PARTICIPANTS_TO_START} joueurs min.` }
  }
  if (t.status === 'completed') return { percent: 100, label: 'Terminé' }
  if (!matches?.length) return null

  if (t.format === 'championship') {
    const league = matches.filter(m => m.bracket_type === 'league')
    if (league.length) {
      const rounds = Math.max(...league.map(m => m.round))
      const open   = league.filter(m => m.status !== 'completed').map(m => m.round)
      return {
        percent: pct(league.filter(m => m.status === 'completed').length, league.length),
        label:   open.length ? `Journée ${Math.min(...open)} / ${rounds}` : 'Playoffs',
      }
    }
  }
  const real = matches.filter(m => m.status !== 'bye')
  const done = real.filter(m => m.status === 'completed').length
  return { percent: pct(done, real.length), label: `${done} / ${real.length} matchs` }
})
</script>

<template>
  <button class="tournament-card" @click="$emit('click')">
    <span class="tournament-card__icon">
      <AppIcon name="trophy" :width="22" :height="22" />
    </span>
    <span class="tournament-card__info">
      <span class="tournament-card__name">{{ tournament.name }}</span>
      <span class="tournament-card__meta">{{ meta }}</span>
    </span>
    <span v-if="isLive" class="tournament-card__badge tournament-card__badge--live">
      <span class="tournament-card__dot" />Live
    </span>
    <span v-else-if="isPending" class="tournament-card__badge">Inscriptions</span>
    <span v-else class="tournament-card__badge tournament-card__badge--done">Terminé</span>

    <span v-if="progress" class="tournament-card__progress">
      <span class="tournament-card__progress-label">{{ progress.label }}</span>
      <span class="tournament-card__progress-percent">{{ progress.percent }}%</span>
      <span class="tournament-card__bar"><span class="tournament-card__fill" :style="{ width: `${progress.percent}%` }" /></span>
    </span>

    <span class="tournament-card__row">
      <template v-if="isPending && tournament.join_code">
        <span class="tournament-card__row-label">Code</span>
        <span class="tournament-card__row-value">{{ tournament.join_code }}</span>
      </template>
      <template v-else>
        <span class="tournament-card__row-label">Joueurs</span>
        <span class="tournament-card__row-value">{{ playerCount }}</span>
      </template>
    </span>
  </button>
</template>

<style lang="scss" scoped>
.tournament-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  grid-template-areas:
    'icon info badge'
    'progress progress progress'
    'row row row';
  align-items: center;
  gap: $gap-xs $gap-sm;
  padding: $padding-sm;
  border-radius: $radius-sm;
  background: $surface;
  color: $text-color;
  text-align: left;
  transition: background 0.15s;

  &:active { background: $border-color; }

  &__icon {
    grid-area: icon;
    width: 44px;
    height: 44px;
    border-radius: $radius-sm;
    background: $mode-tournament;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__info {
    grid-area: info;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__name {
    @include title-lg;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    @include text-xs;
    color: $muted;
  }

  &__badge {
    grid-area: badge;
    justify-self: end;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px $padding-xs;
    border-radius: $radius-sm;
    background: $border-color;
    color: $text-color;
    @include title-xxs;
    letter-spacing: 0.04em;

    &--live {
      background: $error;
      color: $white;
    }

    &--done { color: $muted; }
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: $white;
  }

  &__progress {
    grid-area: progress;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: 'bar label';
    align-items: center;
    gap: $gap-xs;
  }

  &__bar {
    grid-area: bar;
    display: block;
    height: 6px;
    border-radius: 2px;
    background: $border-color;
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    background: $mode-tournament;
  }

  &__progress-label {
    grid-area: label;
    @include text-xs;
    font-weight: 600;
    color: $muted;
  }

  &__progress-percent { display: none; }

  &__row {
    grid-area: row;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__row-label {
    @include text-sm;
    color: $muted;
  }

  &__row-value {
    @include title-sm;
  }
}

@media (min-width: $bp-laptop) {
  .tournament-card {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'icon . badge'
      'info info info'
      'progress progress progress'
      'row row row';
    align-items: start;
    gap: $gap-md;
    padding: $padding-lg;

    &__icon { width: 56px; height: 56px; }
    &__name { @include title-xl; line-height: 0.95; white-space: normal; }
    &__meta { @include text-sm; }
    &__badge { @include title-sm; }

    &__progress {
      grid-template-areas: 'label percent' 'bar bar';
      grid-template-columns: 1fr auto;
      gap: $gap-xs;
    }

    &__bar { height: 8px; }
    &__progress-label,
    &__progress-percent { @include text-sm; font-weight: 600; color: $muted; }
    &__progress-percent { display: block; grid-area: percent; }

    &__row {
      padding-top: $padding-sm;
      border-top: $border-sm solid $border-color;
    }

    &__row-label { @include text-sm; }
    &__row-value { @include title-lg; }
  }
}
</style>
