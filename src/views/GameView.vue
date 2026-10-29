<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDarts } from '../composables/useDarts.js'
import { useGameStore } from '../store/gameStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'

import GameLayout from '../components/game/GameLayout.vue'
import GameHeaderButton from '../components/game/GameHeaderButton.vue'
import GameStatusBar from '../components/game/GameStatusBar.vue'
import GameStreakBadge from '../components/game/GameStreakBadge.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import ScoreRoundPanel from '../components/score/ScoreRoundPanel.vue'
import ScoreAnswerBox from '../components/score/ScoreAnswerBox.vue'
import NumericKeypad from '../components/game/NumericKeypad.vue'
import ScoreRecap from '../components/score/ScoreRecap.vue'

const router     = useRouter()
const gameStore  = useGameStore()
const dbStore    = useDbStore()
const badgeStore = useBadgeStore()

const settings = gameStore.gameSettings

const {
  currentScore, currentVolee, inputValue,
  feedbackState, streak, best,
  correctCount, questionIndex, gameOver, timeLeft,
  phase, voleeTotal, history, startedAt,
  correctAnswer,
  nextRound, appendDigit, deleteDigit, validate, cleanup,
} = useDarts(settings)

const showMenu   = ref(false)
const newBadges  = ref([])
const durationMs = ref(0)

// Feedback colors the whole orange zone (header, panel, answer) green or red
const tone = computed(() => {
  if (feedbackState.value === 'correct' || feedbackState.value === 'phase1ok') return 'ok'
  if (feedbackState.value === 'wrong' || feedbackState.value === 'timeout') return 'ko'
  return null
})

const questionProgress = computed(() => settings.maxQuestions
  ? { ratio: questionIndex.value / settings.maxQuestions, text: `${questionIndex.value}/${settings.maxQuestions}` }
  : null)

watch(gameOver, async (val) => {
  if (val) {
    durationMs.value = startedAt.value ? Date.now() - startedAt.value : 0
    await dbStore.saveGameSession({
      correctCount:   correctCount.value,
      totalQuestions: questionIndex.value,
      bestStreak:     best.value,
      // The per-question recap is rebuilt from history when the session is reopened in the stats
      settings: {
        ...settings,
        durationMs: durationMs.value,
        history: history.value.filter(e => e.answer !== undefined),
      },
    })
    const stats = await dbStore.fetchProfileStats()
    newBadges.value = await badgeStore.checkGameBadges({
      correctCount:   correctCount.value,
      totalQuestions: questionIndex.value,
      bestStreak:     best.value,
      cumulativeStats: stats,
    })
  }
})

function finishGame() {
  showMenu.value = false
  cleanup()
  gameOver.value = true
}

function quitGame() {
  showMenu.value = false
  cleanup()
  router.push({ name: 'score-settings' })
}

function onKeydown(e) {
  if (gameOver.value) return
  if (e.key >= '0' && e.key <= '9') appendDigit(e.key)
  else if (e.key === 'Backspace') deleteDigit()
  else if (e.key === 'Enter') validate()
}

onMounted(() => {
  nextRound()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  cleanup()
})
</script>

<template>
  <GameLayout
    title="Entraînement Calcul"
    :feedback="gameOver ? null : tone"
    :over="gameOver"
    @exit="router.push({ name: 'score-settings' })"
  >
    <template #header-right>
      <GameHeaderButton icon="gear" label="Menu de la partie" @click="showMenu = true" />
    </template>

    <template #panel>
      <ScoreRoundPanel
        :phase="phase"
        :current-score="currentScore"
        :current-volee="currentVolee"
        :volee-total="voleeTotal"
        :show-dart-value="settings.showDartValue"
      />
    </template>

    <template #status>
      <GameStatusBar
        desktop-only
        :label="`Question ${questionIndex}`"
        :progress="questionProgress"
      >
        <GameStreakBadge v-if="streak > 0" :value="streak" />
      </GameStatusBar>
    </template>

    <template #answer>
      <ScoreAnswerBox :value="inputValue" :tone="tone" :expected="correctAnswer" />
    </template>

    <NumericKeypad
      style="--key-min: 88px"
      left-key="delete"
      confirm-tone="ink"
      confirm-label="OK"
      @digit="appendDigit"
      @left="deleteDigit"
      @validate="validate"
    />

    <template #over>
      <ScoreRecap
        :history="history"
        :double-validation="settings.doubleValidation"
        :best="best"
        :duration-ms="durationMs"
        @replay="router.push({ name: 'score-settings' })"
        @home="router.push({ name: 'home' })"
      />
    </template>

    <template #modals>
      <GameMenuModal :show="showMenu" @close="showMenu = false" @finish="finishGame" @quit="quitGame" />
      <BadgeUnlockOverlay :badges="newBadges" @done="newBadges = []" />
    </template>
  </GameLayout>
</template>
