<script setup>
import { computed } from 'vue'

const props = defineProps({
  match:            { type: Object, required: true },
  participantsById: { type: Object, required: true }, // id -> participant row
  playable:         { type: Boolean, default: false },
})

const emit = defineEmits(['play'])

const slots = computed(() => [
  { participantId: props.match.player1_participant_id, legs: props.match.player1_legs },
  { participantId: props.match.player2_participant_id, legs: props.match.player2_legs },
])

function slotLabel(participantId) {
  if (participantId) return props.participantsById[participantId]?.player_data?.name ?? '—'
  return props.match.status === 'bye' ? 'Exempt' : 'À déterminer'
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
}
</script>

<template>
  <button
    class="match-card"
    :class="[`match-card--${match.status}`, { 'match-card--locked': !playable }]"
    :data-match-id="match.id"
    :disabled="!playable"
    @click="onClick"
  >
    <span v-if="match.status === 'in_progress'" class="match-card__badge match-card__badge--live">
      <span class="match-card__live-dot" />Live
    </span>
    <span v-else-if="match.status === 'ready' && playable" class="match-card__badge">À jouer</span>

    <template v-for="(slot, i) in slots" :key="i">
      <div v-if="i" class="match-card__divider" />
      <div class="match-card__player" :class="slotModifiers(slot.participantId)">
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
  background: rgba($white, 0.05);
  border: $border-sm solid transparent;
  transition: border-color 0.15s, background 0.15s;

  &--ready {
    border-color: rgba($orange, 0.5);

    &:active { background: rgba($orange, 0.1); }
  }

  // Ready but not launchable by the current user: no call to action
  &--ready#{&}--locked {
    border-color: rgba($white, 0.1);
  }

  &--in_progress {
    border-color: rgba($error, 0.6);
    background: rgba($error, 0.06);

    &:active { background: rgba($error, 0.12); }
  }

  &--bye,
  &--pending {
    opacity: 0.55;
  }

  &--completed {
    border-color: rgba($white, 0.1);
  }

  &:disabled {
    cursor: default;
  }

  &__badge {
    position: absolute;
    top: 0;
    right: $padding-xs;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    @include text-xxs;
    color: $white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: $orange;
    border-radius: $radius-pill;
    padding: 0 $padding-xs;

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
    @include text-sm;
    color: $text-color;
    font-weight: 600;
    padding: $padding-xs $padding-sm;
    text-align: left;

    &--tbd {
      color: $muted;
      font-weight: 400;
      font-style: italic;
    }

    &--winner { color: $orange; }

    &--loser {
      color: $muted;
      font-weight: 400;
    }
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
    font-variant-numeric: tabular-nums;
  }

  &__forfeit {
    flex-shrink: 0;
    @include text-xxs;
    color: $muted;
    font-style: normal;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__divider {
    height: 1px;
    background: rgba($white, 0.08);
  }
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
</style>
