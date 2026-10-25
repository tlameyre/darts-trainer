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

const isPending   = computed(() => props.tournament.status === 'pending')
const isLive      = computed(() => props.tournament.status === 'in_progress')
const joinPercent = computed(() => Math.min(100, Math.round((playerCount.value / MIN_PARTICIPANTS_TO_START) * 100)))

const FORMAT_LABELS = { bracket: 'Bracket', round_robin: 'Championnat', championship: 'Championnat' }

const meta = computed(() => {
  const t = props.tournament
  return `${FORMAT_LABELS[t.format] ?? 'Bracket'} · ${t.start_score} · ${t.legs_to_win} manche${t.legs_to_win > 1 ? 's' : ''}`
})
</script>

<template>
  <button class="tournament-card" @click="$emit('click')">
    <div class="tournament-card__head">
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
    </div>

    <template v-if="isPending">
      <div class="tournament-card__progress">
        <div class="tournament-card__bar"><div class="tournament-card__fill" :style="{ width: `${joinPercent}%` }" /></div>
        <span class="tournament-card__progress-label">{{ playerCount }} / {{ MIN_PARTICIPANTS_TO_START }} joueurs min.</span>
      </div>
      <div v-if="tournament.join_code" class="tournament-card__row">
        <span class="tournament-card__row-label">Code</span>
        <span class="tournament-card__row-value">{{ tournament.join_code }}</span>
      </div>
    </template>
    <div v-else class="tournament-card__row">
      <span class="tournament-card__row-label">Joueurs</span>
      <span class="tournament-card__row-value">{{ playerCount }}</span>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.tournament-card {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  padding: $padding-sm;
  border-radius: $radius-sm;
  background: $surface;
  color: $text-color;
  text-align: left;
  transition: background 0.15s;

  &:active { background: $border-color; }

  &__head {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__icon {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: $radius-sm;
    background: $mode-tournament;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__info {
    flex: 1;
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
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
    padding: 3px $padding-xs;
    border-radius: $radius-sm;
    background: $border-color;
    color: $text-color;
    @include title-xxs;

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
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__bar {
    flex: 1;
    height: 6px;
    border-radius: 2px;
    background: $border-color;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $mode-tournament;
  }

  &__progress-label {
    @include text-xs;
    font-weight: 600;
    color: $muted;
  }

  &__row {
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
    padding: $padding-md;

    &__icon { width: 52px; height: 52px; }
    &__name { @include title-xl; line-height: 1; }
    &__meta { @include text-sm; }
    &__badge { @include title-sm; }
    &__progress-label { @include text-sm; }
    &__row-label { @include text-md; }
    &__row-value { @include title-md; }
  }
}
</style>
