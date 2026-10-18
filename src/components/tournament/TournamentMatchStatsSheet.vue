<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import X01Result from '../x01/X01Result.vue'

const props = defineProps({
  match:        { type: Object,  default: null }, // ligne tournament_matches ; null = fermé
  participants: { type: Array,   required: true },
  startScore:   { type: Number,  required: true },
  matchStats:   { type: Object,  default: null }, // sortie de buildMatchStats(), null si aucune session
  loading:      { type: Boolean, default: false },
  myUserId:     { type: String,  default: null },
})

defineEmits(['close'])

const nameOf = id => props.participants.find(p => p.id === id)?.player_data?.name ?? '—'

// isMe was stored from the point of view of whoever saved the session
const viewerStats = computed(() => {
  if (!props.matchStats) return null
  const myName = props.participants.find(p => p.user_id && p.user_id === props.myUserId)?.player_data?.name
  return {
    ...props.matchStats,
    players: props.matchStats.players.map(p => ({ ...p, isMe: !!myName && p.name === myName })),
  }
})

const heading = computed(() => {
  const m = props.match
  if (!m) return ''
  const versus = `${nameOf(m.player1_participant_id)} vs ${nameOf(m.player2_participant_id)}`
  return m.bracket_type === 'league' ? `Journée ${m.round} · ${versus}` : versus
})

const title    = computed(() => `${nameOf(props.match?.winner_participant_id)} a gagné le match !`)
const subtitle = computed(() => {
  const m = props.match
  if (!m) return ''
  const score = m.player1_legs != null && m.player2_legs != null ? ` · ${m.player1_legs} – ${m.player2_legs}` : ''
  return `${props.startScore} pts${score}`
})
</script>

<template>
  <Transition name="slide-up">
    <div v-if="match" class="match-sheet">
      <div class="match-sheet__topbar">
        <button class="match-sheet__close" aria-label="Fermer" @click="$emit('close')">
          <AppIcon name="arrow-left" :width="20" :height="20" />
        </button>
        <span class="match-sheet__heading">{{ heading }}</span>
        <span class="match-sheet__spacer" />
      </div>

      <p v-if="loading" class="match-sheet__empty">Chargement des stats…</p>
      <X01Result v-else :match-stats="viewerStats" :title="title" :subtitle="subtitle" hide-actions />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.match-sheet {
  position: fixed;
  inset: 0;
  background: $bg;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: $padding-md $padding-md 0;

  &__topbar {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    margin-bottom: $gap-md;
    flex-shrink: 0;
  }

  &__close,
  &__spacer {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: rgba($white, 0.07);
    color: $text-color;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__heading {
    flex: 1;
    min-width: 0;
    @include title-xs;
    color: $muted;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl 0;
  }
}

@media (min-width: $bp-laptop) {
  .match-sheet {
    padding: $padding-xl;

    &__heading { @include title-sm; }
    &__empty   { @include text-md; }
  }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(24px); opacity: 0; }
</style>
