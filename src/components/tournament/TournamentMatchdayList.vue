<script setup>
import { ref, computed, watch } from 'vue'
import AppTabs from '../AppTabs.vue'
import TournamentMatchCard from './TournamentMatchCard.vue'
import { leagueMatches, byesForMatchday } from '../../composables/useChampionship.js'

const props = defineProps({
  matches:      { type: Array, required: true },
  participants: { type: Array, required: true },
  // Matchs que l'utilisateur courant a le droit de lancer ou rejoindre
  playableMatchIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['play'])

const participantsById = computed(() => Object.fromEntries(props.participants.map(p => [p.id, p])))

const matchdays = computed(() => {
  const byRound = {}
  for (const m of leagueMatches(props.matches)) {
    byRound[m.round] = byRound[m.round] || []
    byRound[m.round].push(m)
  }
  return Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b)
    .map(round => ({
      round,
      matches: byRound[round].sort((a, b) => a.slot_in_round - b.slot_in_round),
      done:    byRound[round].every(m => m.status === 'completed'),
    }))
})

const tabs = computed(() => matchdays.value.map(d => ({ id: String(d.round), label: `J${d.round}` })))

// Par défaut, la première journée qui reste à jouer
const selectedRound = ref('')
watch(matchdays, (days) => {
  if (days.some(d => String(d.round) === selectedRound.value)) return
  selectedRound.value = String((days.find(d => !d.done) ?? days[days.length - 1])?.round ?? '')
}, { immediate: true })

const current = computed(() => matchdays.value.find(d => String(d.round) === selectedRound.value) ?? null)
const byes    = computed(() =>
  current.value ? byesForMatchday(props.matches, props.participants, current.value.round) : []
)
</script>

<template>
  <div class="matchdays">
    <AppTabs v-model="selectedRound" :tabs="tabs" variant="underline" scrollable />

    <div v-if="current" class="matchdays__day">
      <div class="matchdays__header">
        <span class="matchdays__title">Journée {{ current.round }}</span>
        <span v-if="current.done" class="matchdays__status">Terminée</span>
      </div>
      <TournamentMatchCard
        v-for="m in current.matches" :key="m.id"
        class="matchdays__card"
        :match="m"
        :participants-by-id="participantsById"
        :playable="playableMatchIds.includes(m.id)"
        @play="emit('play', m.id)"
      />
      <p v-if="byes.length" class="matchdays__bye">
        Exempt : {{ byes.map(p => p.player_data?.name).join(', ') }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.matchdays {
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__day {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  &__title {
    @include title-md;
    color: $white;
  }

  &__status {
    @include text-xs;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__card {
    width: 100%;
  }

  &__bye {
    @include text-sm;
    color: $muted;
    font-style: italic;
  }
}

@media (min-width: $bp-laptop) {
  .matchdays {
    &__title  { @include title-lg; }
    &__status { @include text-sm; }
    &__bye    { @include text-md; }
  }
}
</style>
