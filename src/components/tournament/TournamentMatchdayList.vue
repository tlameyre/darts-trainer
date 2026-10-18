<script setup>
import { ref, computed, watch } from 'vue'
import AppIcon from '../AppIcon.vue'
import TournamentMatchCard from './TournamentMatchCard.vue'
import { leagueMatches, byesForMatchday } from '../../composables/useChampionship.js'

const props = defineProps({
  matches:      { type: Array, required: true },
  participants: { type: Array, required: true },
  // Matchs que l'utilisateur courant a le droit de lancer ou rejoindre
  playableMatchIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['play', 'details'])

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

// Par défaut, la première journée qui reste à jouer
const selectedIndex = ref(0)
watch(() => matchdays.value.length, (count) => {
  if (!count) return
  const firstOpen = matchdays.value.findIndex(d => !d.done)
  selectedIndex.value = firstOpen === -1 ? count - 1 : firstOpen
}, { immediate: true })

const current     = computed(() => matchdays.value[selectedIndex.value] ?? null)
const playedCount = computed(() => current.value?.matches.filter(m => m.status === 'completed').length ?? 0)

function step(delta) {
  selectedIndex.value = Math.min(matchdays.value.length - 1, Math.max(0, selectedIndex.value + delta))
}

const byes    = computed(() =>
  current.value ? byesForMatchday(props.matches, props.participants, current.value.round) : []
)
</script>

<template>
  <div class="matchdays">
    <div v-if="current" class="matchdays__day">
      <div class="matchdays__nav">
        <button class="matchdays__arrow" :disabled="selectedIndex === 0" aria-label="Journée précédente" @click="step(-1)">
          <AppIcon name="arrow-left" :width="18" :height="18" />
        </button>
        <div class="matchdays__heading">
          <span class="matchdays__title">Journée {{ current.round }}<span class="matchdays__total"> / {{ matchdays.length }}</span></span>
          <span class="matchdays__status">
            {{ current.done ? 'Terminée' : `${playedCount}/${current.matches.length} joués` }}
          </span>
        </div>
        <button
          class="matchdays__arrow"
          :disabled="selectedIndex === matchdays.length - 1"
          aria-label="Journée suivante"
          @click="step(1)"
        >
          <AppIcon name="arrow-right" :width="18" :height="18" />
        </button>
      </div>
      <TournamentMatchCard
        v-for="m in current.matches" :key="m.id"
        class="matchdays__card"
        :match="m"
        :participants-by-id="participantsById"
        :playable="playableMatchIds.includes(m.id)"
        @play="emit('play', m.id)"
        @details="emit('details', m.id)"
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

  &__nav {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__arrow {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    border: $border-md solid rgba($white, 0.15);
    background: rgba($white, 0.05);
    color: $text-color;
    transition: border-color 0.15s, color 0.15s, opacity 0.15s;

    &:active:not(:disabled) {
      border-color: $orange;
      color: $orange;
    }

    &:disabled { opacity: 0.3; }
  }

  &__heading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__title {
    @include title-md;
    color: $white;
  }

  &__total { color: $muted; }

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
