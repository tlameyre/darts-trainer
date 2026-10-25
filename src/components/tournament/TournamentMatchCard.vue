<script setup>
import { computed } from 'vue'
import { avatarColor } from '../../utils/avatarColor.js'

const props = defineProps({
  match:            { type: Object, required: true },
  participantsById: { type: Object, required: true }, // id -> participant row
  playable:         { type: Boolean, default: false },
})

const emit = defineEmits(['play', 'details'])

// Terminé (hors forfait) : la carte ouvre les stats du match
const hasDetails = computed(() => props.match.status === 'completed' && !props.match.forfeited)

const slots = computed(() => [
  { participantId: props.match.player1_participant_id, legs: props.match.player1_legs },
  { participantId: props.match.player2_participant_id, legs: props.match.player2_legs },
])

function slotLabel(participantId) {
  if (participantId) return props.participantsById[participantId]?.player_data?.name ?? '—'
  return props.match.status === 'bye' ? 'Exempt' : 'À déterminer'
}

function slotName(participantId) {
  return participantId ? props.participantsById[participantId]?.player_data?.name ?? '' : ''
}

function slotModifiers(participantId) {
  const completed = props.match.status === 'completed'
  return {
    'match-card__player--winner': completed && participantId === props.match.winner_participant_id,
    'match-card__player--loser':  completed && !!participantId && participantId !== props.match.winner_participant_id,
    'match-card__player--tbd':    !participantId,
  }
}

// A forfeited match shows who gave up rather than a meaningless leg count
function isForfeitLoser(participantId) {
  return props.match.forfeited && !!participantId && participantId !== props.match.winner_participant_id
}

function onClick() {
  if (props.playable) emit('play')
  else if (hasDetails.value) emit('details')
}
</script>

<template>
  <button
    class="match-card"
    :class="[`match-card--${match.status}`, { 'match-card--locked': !playable, 'match-card--viewable': hasDetails }]"
    :data-match-id="match.id"
    :disabled="!playable && !hasDetails"
    @click="onClick"
  >
    <span v-if="match.status === 'in_progress'" class="match-card__badge match-card__badge--live">
      <span class="match-card__live-dot" />Live
    </span>
    <span v-else-if="match.status === 'ready' && playable" class="match-card__badge">À jouer</span>

    <template v-for="(slot, i) in slots" :key="i">
      <div v-if="i" class="match-card__divider" />
      <div class="match-card__player" :class="slotModifiers(slot.participantId)">
        <span
          v-if="slot.participantId"
          class="match-card__avatar"
          :style="{ background: avatarColor(slotName(slot.participantId)) }"
        >{{ slotName(slot.participantId)[0] }}</span>
        <span class="match-card__name">{{ slotLabel(slot.participantId) }}</span>
        <span v-if="isForfeitLoser(slot.participantId)" class="match-card__forfeit">Abandon</span>
        <span v-else-if="slot.legs != null && !match.forfeited" class="match-card__legs">{{ slot.legs }}</span>
      </div>
    </template>
  </button>
</template>

<style lang="scss" scoped>
.match-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 168px;
  border-radius: $radius-sm;
  background: $surface;
  border: $border-md solid $border-color;
  transition: background 0.15s;

  &--ready:not(&--locked) {
    border-color: $mode-tournament;
    background: $white;

    &:active { background: $surface; }
  }

  &--in_progress {
    border-color: $error;
    background: $white;

    &:active { background: $surface; }
  }

  &--pending,
  &--bye {
    background: transparent;
    border-style: dashed;
  }

  &--viewable:active { background: $surface; }

  &:disabled {
    cursor: default;
  }

  &__badge {
    position: absolute;
    top: -11px;
    right: $padding-xs;
    display: flex;
    align-items: center;
    gap: 5px;
    @include title-xxs;
    letter-spacing: 0.04em;
    color: $white;
    background: $mode-tournament;
    border-radius: $radius-sm;
    padding: 2px $padding-xs;

    &--live { background: $error; }
  }

  &__live-dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: $white;
    animation: live-pulse 1.2s ease-in-out infinite;
  }

  &__player {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    min-height: var(--match-row, 36px);
    padding: 0 $padding-xs;
    @include title-sm;
    line-height: 1;
    color: $text-color;
    text-align: left;

    &--tbd {
      @include text-xs;
      color: $muted;
      font-style: italic;
    }

    &--winner { color: $mode-tournament; }

    &--loser { color: $muted; }
  }

  &__avatar {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border-radius: $radius-pill;
    color: $white;
    @include title-xxs;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__name {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__legs {
    flex-shrink: 0;
    @include title-md;
    font-variant-numeric: tabular-nums;
  }

  &__forfeit {
    flex-shrink: 0;
    @include text-xxs;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__divider {
    height: 1px;
    background: $border-color;
  }
}

@media (min-width: $bp-laptop) {
  .match-card {
    --match-row: 44px;

    &__player { @include title-lg; }
    &__legs { @include title-xl; }
    &__avatar { width: 22px; }
    &__badge { @include title-sm; }
  }
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
</style>
