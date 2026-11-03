<script setup>
import { ref, shallowRef, computed, watch } from 'vue'
import AppButton from '../AppButton.vue'
import GameEntryBar from '../game/GameEntryBar.vue'
import DartboardEntry from '../game/DartboardEntry.vue'
import CheckoutRouteCard from './CheckoutRouteCard.vue'
import CheckoutBoardRoute from './CheckoutBoardRoute.vue'

const INPUT_KEY = 'checkout-quiz-input'
const inputMode = ref(
  (() => {
    try {
      return localStorage.getItem(INPUT_KEY) === 'dart' ? 'dart' : 'board'
    } catch {
      return 'board'
    }
  })(),
)
function setInputMode(m) {
  inputMode.value = m
  try {
    localStorage.setItem(INPUT_KEY, m)
  } catch {
    /* storage unavailable */
  }
}

const props = defineProps({
  checkout: { type: Object, default: null },
  attemptDarts: { type: Array, required: true },
  answered: { type: Boolean, default: false },
  lastResult: { type: Object, default: null }, // { score, darts, correct, optimal, points }
  progress: { type: Object, required: true },
})

const emit = defineEmits(['dart', 'undo', 'submit', 'next'])

const isLast = computed(() => Number.isFinite(props.progress.total) && props.progress.index + 1 >= props.progress.total)

// Route shown on the board once answered: the one played when valid, else the
// recommended one. Picking another row keeps studying the other finishes.
const playedRoute = computed(() => (props.lastResult?.correct ? props.lastResult.darts : null))
const studyRoute = shallowRef(null)
watch(
  () => props.answered,
  (a) => {
    if (a) studyRoute.value = playedRoute.value ?? props.checkout?.primary ?? null
  },
)
</script>

<template>
  <div class="quiz">
    <div class="quiz__entry">
      <span class="quiz__label">Ta sortie<template v-if="!answered"> · {{ inputMode === 'board' ? 'cible' : 'fléchette par fléchette' }}</template></span>
      <GameEntryBar
        class="quiz__entry-bar"
        :mode="inputMode"
        :modes="['board', 'dart']"
        :darts="attemptDarts"
        :locked="answered"
        @select="setInputMode"
        @erase="emit('undo')"
      />
    </div>

    <div class="quiz__stage">
      <CheckoutBoardRoute v-if="answered" :route="studyRoute || []" />
      <DartboardEntry
        v-else
        :mode="inputMode"
        :locked="attemptDarts.length >= 3"
        :actions="false"
        zoomable
        @dart="emit('dart', $event)"
      />
    </div>

    <div v-if="answered" class="quiz__info">
      <span class="quiz__label">Routes</span>
      <CheckoutRouteCard
        :checkout="checkout"
        selectable
        :selected="studyRoute"
        :played="playedRoute"
        @select="studyRoute = $event"
      />
    </div>
    <p v-else class="quiz__help">
      {{ inputMode === 'board' ? 'Clique sur la cible' : 'Choisis le secteur' }} pour chaque fléchette de ta sortie.
      La réponse est validée dès que la sortie est complète.
    </p>

    <AppButton v-if="answered" size="cta" tone="black" icon-end="arrow-right" @click="emit('next')">
      {{ isLast ? 'Voir le récap' : 'Question suivante' }}
    </AppButton>
    <AppButton v-else size="cta" tone="cyan" icon="check" :disabled="!attemptDarts.length" @click="emit('submit')">
      Valider
    </AppButton>
  </div>
</template>

<style lang="scss" scoped>
.quiz {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__label {
    display: none;
    @include title-sm;
    color: $muted;
  }

  &__entry {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__entry-bar { --entry-color: #{$mode-checkout}; }

  &__stage {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    container-type: size;

    > .dartboard-entry { width: 100%; }
  }

  &__info {
    flex-shrink: 0;
    max-height: 30%;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    overflow-y: auto;
  }

  &__help { display: none; }
}

@media (min-width: $bp-laptop) {
  .quiz {
    gap: $gap-md;

    &__label { display: block; @include title-md; }

    &__help {
      display: block;
      @include text-md;
      line-height: 1.45;
      color: $muted;
    }
  }
}
</style>
