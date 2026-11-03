<script setup>
import { ref, computed, watch } from 'vue'
import AppHeader from '../AppHeader.vue'
import X01MatchEnd from '../x01/X01MatchEnd.vue'

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

const winnerIndex = computed(() => {
  const name = nameOf(props.match?.winner_participant_id)
  const idx = viewerStats.value?.players.findIndex(p => p.name === name) ?? -1
  return idx >= 0 ? idx : null
})

const subtitle = computed(() => {
  const m = props.match
  if (!m) return ''
  const score = m.player1_legs != null && m.player2_legs != null ? ` · ${m.player1_legs} – ${m.player2_legs}` : ''
  return `${props.startScore} pts${score}`
})

// The match recap has its own header inside a leg detail
const inLegDetail = ref(false)
watch(() => props.match?.id, () => { inLegDetail.value = false })
</script>

<template>
  <Transition name="slide-up">
    <div v-if="match" class="match-sheet">
      <AppHeader v-if="!inLegDetail" :title="heading" tone="tournament" @back="$emit('close')" />

      <p v-if="loading" class="match-sheet__empty">Chargement des stats…</p>
      <X01MatchEnd
        v-else
        class="match-sheet__recap"
        :match-stats="viewerStats"
        :winner-index="winnerIndex"
        :subtitle="subtitle"
        hide-actions
        @leg-detail="inLegDetail = $event"
      />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.match-sheet {
  --game-color: #{$mode-tournament};
  position: fixed;
  inset: 0;
  background: $bg;
  z-index: 100;
  display: flex;
  flex-direction: column;

  &__recap {
    flex: 1;
    min-height: 0;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl 0;
  }
}

@media (min-width: $bp-laptop) {
  .match-sheet__empty { @include text-md; }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(24px); opacity: 0; }
</style>
