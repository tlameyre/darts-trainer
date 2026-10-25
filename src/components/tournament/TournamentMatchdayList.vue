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
      <div class="matchdays__head">
        <span class="matchdays__title matchdays__title--lg">Journée {{ current.round }}<span class="matchdays__total"> / {{ matchdays.length }}</span></span>
        <span class="matchdays__status">
          {{ current.done ? 'Terminée' : `${playedCount} / ${current.matches.length} joués` }}
        </span>
      </div>
      <nav class="matchdays__rounds" aria-label="Journées">
        <button
          v-for="(d, i) in matchdays" :key="d.round"
          class="matchdays__round"
          :class="{ 'matchdays__round--current': i === selectedIndex, 'matchdays__round--done': d.done }"
          :aria-current="i === selectedIndex"
          @click="selectedIndex = i"
        >{{ d.round }}</button>
      </nav>

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
      <div class="matchdays__cards">
        <TournamentMatchCard
          v-for="m in current.matches" :key="m.id"
          class="matchdays__card"
          :match="m"
          :participants-by-id="participantsById"
          :playable="playableMatchIds.includes(m.id)"
          @play="emit('play', m.id)"
          @details="emit('details', m.id)"
        />
      </div>
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

  &__head,
  &__rounds { display: none; }

  &__cards {
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
    gap: $gap-lg;

    &__day { gap: $gap-lg; }

    // Desktop swaps the arrows and dots for a row of numbered rounds
    &__nav,
    &__dots { display: none; }

    &__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    &__title--lg { @include title-xxxl; line-height: 1; }
    &__status { @include text-sm; }

    &__rounds {
      display: flex;
      gap: $gap-xxs;
    }

    &__round {
      flex: 1;
      height: 44px;
      border: $border-md solid $border-color;
      border-radius: $radius-sm;
      color: $muted;
      @include title-md;

      &--done {
        border-color: $surface;
        background: $surface;
        color: $text-color;
      }

      &--current {
        border-color: $mode-tournament;
        background: $mode-tournament;
        color: $white;
      }
    }

    &__cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px 20px;
      padding-top: $padding-xs;
    }

    &__card { --match-row: 52px; }

    &__bye { @include text-md; }
  }
}
</style>
