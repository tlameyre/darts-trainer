<script setup>
import { computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import GameLayout from '../components/game/GameLayout.vue'
import GameHeaderButton from '../components/game/GameHeaderButton.vue'
import GameStatusBar from '../components/game/GameStatusBar.vue'
import CheckoutQuizPanel from '../components/checkout/CheckoutQuizPanel.vue'
import CheckoutFlashcard from '../components/checkout/CheckoutFlashcard.vue'
import CheckoutQuizInput from '../components/checkout/CheckoutQuizInput.vue'
import CheckoutRecap from '../components/checkout/CheckoutRecap.vue'
import { useGameStore } from '../store/gameStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useCheckoutTrainer } from '../composables/useCheckoutTrainer.js'
import { describeResult } from '../composables/useCheckouts.js'

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
      // Per-question results let the stats reopen the same recap as at the end of the quiz
      settings: { brackets: settings.brackets, order: settings.order, results: results.value },
    })
  }
})

const quizResult = computed(() => (answered.value ? describeResult(lastResult.value) : null))

const questionProgress = computed(() => Number.isFinite(progress.value.total)
  ? { ratio: progress.value.index / progress.value.total, text: `${progress.value.index + 1}/${progress.value.total}` }
  : null)

function backToSettings() {
  router.push({ name: 'checkout-settings' })
}

onUnmounted(() => cleanup())
</script>

<template>
  <div v-if="gameOver" class="co-over">
    <CheckoutRecap
      :variant="isQuiz ? 'quiz' : 'review'"
      :session-stats="sessionStats"
      :results="results"
      :reviewed-count="reviewDone"
      :review-total="reviewTotal"
      @exit="backToSettings"
      @restart="backToSettings"
      @home="router.push({ name: 'home' })"
    />
  </div>

  <GameLayout
    v-else-if="isQuiz"
    title="Quiz noté"
    tone="cyan"
    :feedback="quizResult?.tone ?? null"
    stack
    @exit="backToSettings"
  >
    <template #header-right>
      <GameHeaderButton icon="check" label="Terminer" @click="endSession" />
    </template>

    <template #panel>
      <CheckoutQuizPanel :score="currentScore" :result="quizResult" :progress="progress" :points="sessionStats.points" />
    </template>

    <template #status>
      <GameStatusBar
        :label="`Question ${progress.index + 1}`"
        :progress="questionProgress"
        :mobile-summary="`Question ${progress.index + 1}${Number.isFinite(progress.total) ? ` / ${progress.total}` : ''} · ${sessionStats.points} pts`"
      />
    </template>

    <CheckoutQuizInput
      :checkout="currentCheckout"
      :attempt-darts="attemptDarts"
      :answered="answered"
      :last-result="lastResult"
      :progress="progress"
      @dart="pushDart"
      @undo="undoDart"
      @submit="submit"
      @next="next"
    />
  </GameLayout>

  <GameLayout v-else title="Révision" tone="cyan" plain @exit="backToSettings">
    <template #header-right>
      <GameHeaderButton icon="check" label="Terminer" @click="endSession" />
    </template>

    <CheckoutFlashcard
      :score="currentScore"
      :checkout="currentCheckout"
      :revealed="revealed"
      :done="reviewDone"
      :total="reviewTotal"
      @toggle="toggleReveal"
      @grade="grade"
    />
  </GameLayout>
</template>

<style lang="scss" scoped>
.co-over {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}
</style>
