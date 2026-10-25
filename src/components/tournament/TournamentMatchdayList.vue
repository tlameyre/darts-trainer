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
      <div class="matchdays__dots">
        <span
          v-for="(d, i) in matchdays" :key="d.round"
          class="matchdays__dot"
          :class="{ 'matchdays__dot--done': d.done, 'matchdays__dot--current': i === selectedIndex }"
        />
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
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
  }

  &__arrow {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;
    transition: opacity 0.15s;

    &:active:not(:disabled) { background: $border-color; }

    &:disabled { opacity: 0.3; }
  }

  &__heading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__title {
    @include title-lg;
    line-height: 1;
  }

  &__total { color: $muted; }

  &__status {
    @include text-xs;
    color: $muted;
  }

  &__dots {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: $border-color;

    &--done { background: $black; }

    &--current {
      width: 18px;
      background: $mode-tournament;
    }
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
    &__title  { @include title-xl; }
    &__status { @include text-sm; }
    &__bye    { @include text-md; }
  }
}
</style>
