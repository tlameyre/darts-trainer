<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  tournament: { type: Object, required: true },
})

// player_count is only set at start: count the roster for pending tournaments
const playerCount = computed(() =>
  props.tournament.tournament_participants?.[0]?.count ?? props.tournament.player_count
)

defineEmits(['click'])

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const STATUS_LABELS = { pending: 'Pas démarré', in_progress: 'En cours', completed: 'Terminé' }
const FORMAT_LABELS = { bracket: 'Bracket', championship: 'Championnat' }
</script>

<template>
  <button class="tournament-card" @click="$emit('click')">
    <div class="tournament-card__icon" :class="{ 'tournament-card__icon--done': tournament.status === 'completed' }">
      <AppIcon name="trophy" :width="22" :height="22" />
    </div>
    <div class="tournament-card__info">
      <span class="tournament-card__name">{{ tournament.name }}</span>
      <span class="tournament-card__meta">
        {{ FORMAT_LABELS[tournament.format] ?? 'Bracket' }} · {{ playerCount }} joueur{{ playerCount > 1 ? 's' : '' }} · {{ formatDate(tournament.created_at) }}
      </span>
    </div>
    <span class="tournament-card__status" :class="`tournament-card__status--${tournament.status}`">
      {{ STATUS_LABELS[tournament.status] ?? tournament.status }}
    </span>
  </button>
</template>

<style lang="scss" scoped>
.tournament-card {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  padding: $padding-xs;
  border-radius: $radius-sm;
  background: $surface;
  color: $text-color;
  text-align: left;
  transition: background 0.15s;

  &:active { background: $border-color; }

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

    &--done { background: $orange; }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
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

  &__status {
    flex-shrink: 0;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: $border-color;
    @include title-sm;

    &--in_progress {
      background: $error;
      color: $white;
    }

    &--completed { color: $muted; }
  }
}

@media (min-width: $bp-laptop) {
  .tournament-card {
    padding: $padding-sm;

    &__icon {
      width: 48px;
      height: 48px;
    }

    &__name { @include title-xl; line-height: 1; }
    &__meta { @include text-sm; }
    &__status { @include title-md; }
  }
}
</style>
