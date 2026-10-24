<script setup>
import { watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import CheckoutFlashcard from '../components/checkout/CheckoutFlashcard.vue'
import CheckoutQuizInput from '../components/checkout/CheckoutQuizInput.vue'
import CheckoutRecap from '../components/checkout/CheckoutRecap.vue'
import { useGameStore } from '../store/gameStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useCheckoutTrainer } from '../composables/useCheckoutTrainer.js'

const router = useRouter()
const gameStore = useGameStore()
const dbStore = useDbStore()

if (!gameStore.gameSettings || gameStore.gameSettings.mode !== 'checkout') {
  router.replace({ name: 'checkout-settings' })
}

const settings = gameStore.gameSettings ?? {
  variant: 'review',
  brackets: [[2, 170]],
  order: 'asc',
  count: 'all',
}

const {
  isQuiz, currentScore, currentCheckout, gameOver, progress,
  revealed, toggleReveal, grade, reviewDone, reviewTotal,
  attemptDarts, answered, pushDart, undoDart, submit, results, lastResult, sessionStats,
  next, endSession, cleanup,
} = useCheckoutTrainer(settings)

watch(gameOver, async (over) => {
  if (over && isQuiz) {
    const s = sessionStats.value
    await dbStore.saveCheckoutSession({
      questions: s.questions,
      correctCount: s.correct,
      optimalCount: s.optimal,
      bestStreak: s.bestStreak,
      points: s.points,
      settings: { brackets: settings.brackets, order: settings.order },
    })
  }
})

function backToSettings() {
  router.push({ name: 'checkout-settings' })
}

onUnmounted(() => cleanup())
</script>

<template>
  <div class="co-game">
    <CheckoutRecap
      v-if="gameOver"
      :variant="isQuiz ? 'quiz' : 'review'"
      :session-stats="sessionStats"
      :results="results"
      :reviewed-count="reviewDone"
      :review-total="reviewTotal"
      @exit="backToSettings"
      @restart="backToSettings"
      @home="router.push({ name: 'home' })"
    />

    <template v-else>
      <AppHeader :title="isQuiz ? 'Quiz noté' : 'Révision'" tone="cyan" back-icon="exit" @back="backToSettings">
        <template #right>
          <button class="co-game__end-btn" aria-label="Terminer" @click="endSession">
            <AppIcon name="check" :width="24" :height="24" />
          </button>
        </template>
      </AppHeader>

      <main class="co-game__main">
        <CheckoutQuizInput
          v-if="isQuiz"
          :score="currentScore"
          :checkout="currentCheckout"
          :attempt-darts="attemptDarts"
          :answered="answered"
          :last-result="lastResult"
          :progress="progress"
          :points="sessionStats.points"
          @dart="pushDart"
          @undo="undoDart"
          @submit="submit"
          @next="next"
        />

        <CheckoutFlashcard
          v-else
          :score="currentScore"
          :checkout="currentCheckout"
          :revealed="revealed"
          :done="reviewDone"
          :total="reviewTotal"
          @toggle="toggleReveal"
          @grade="grade"
        />
      </main>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.co-game {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;

  &__main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: $padding-md $padding-md 0;
    @include safe-bottom($padding-xl);
  }

  &__end-btn {
    display: flex;
    padding: $padding-xxs;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }
}

@media (min-width: $bp-laptop) {
  .co-game__main {
    padding: $padding-xxl $padding-xxl 0;
    @include safe-bottom($padding-xxl);
  }
}
</style>
