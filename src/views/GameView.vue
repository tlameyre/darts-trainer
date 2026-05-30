<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDarts } from '../composables/useDarts.js'
import { gameSettings } from '../store/gameStore.js'
import { saveGameSession } from '../store/dbStore.js'

import AppHeader from '../components/AppHeader.vue'
import AnswerInput from '../components/AnswerInput.vue'
import NumPad from '../components/NumPad.vue'
import GameOver from '../components/GameOver.vue'
import GameTourRow from '../components/game/GameTourRow.vue'
import GameRoundCard from '../components/game/GameRoundCard.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'

const route = useRoute()
const router = useRouter()

const {
  currentScore, currentVolee, inputValue,
  feedbackState, streak, best,
  correctCount, questionIndex, gameOver, timeLeft,
  phase, voleeTotal,
  correctAnswer, questionLabel, phaseLabel,
  nextRound, appendDigit, deleteDigit, validate, cleanup,
} = useDarts(gameSettings.value)

watch(gameOver, (val) => {
  if (val) {
    saveGameSession({
      correctCount:   correctCount.value,
      totalQuestions: questionIndex.value,
      bestStreak:     best.value,
      settings:       gameSettings.value,
    })
  }
})

const showMenu = ref(false)

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
  <div class="game" :class="{ gameOver: 'game-over' }">
    <AppHeader title="ENTRAINEMENT" @back="router.push({ name: 'score-settings' })">
      <template v-if="!gameOver" #right>
        <button class="game__menu-btn" @click="showMenu = true">
          <AppIcon name="gear" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <main class="game__main">
      <GameOver v-if="gameOver" :correct-count="correctCount"
        :max-questions="gameSettings.maxQuestions ?? questionLabel" :best="best"
        @replay="router.push({ name: 'score-game', query: { t: Date.now() } })"
        @home="router.push({ name: 'play' })" />

      <template v-else>
        <GameRoundCard :phase="phase" :current-score="currentScore" :current-volee="currentVolee"
          :volee-total="voleeTotal" :feedback-state="feedbackState" :correct-answer="correctAnswer"
          :show-value="gameSettings.showDartValue" />

        <GameTourRow :question-label="questionLabel" :phase="phase" :show-phase="gameSettings.doubleValidation"
          :time-left="timeLeft" :show-timer="!!gameSettings.timeLimit" :is-urgent="timeLeft <= 5" />

        <AnswerInput :value="inputValue" :placeholder="phaseLabel"
          :has-error="feedbackState === 'wrong' || feedbackState === 'timeout'" @validate="validate" />

        <NumPad @digit="appendDigit" @delete="deleteDigit" @validate="validate" />
      </template>
    </main>

    <GameMenuModal :show="showMenu" @close="showMenu = false" @finish="finishGame" @quit="quitGame" />
  </div>
</template>

<style lang="scss" scoped>
.game {
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: $padding-md;
  align-items: center;
  gap: $gap-md;

  &.gameOver {
    padding: $padding-md $padding-md $padding-xxl;
  }

  &__menu-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    padding: $padding-xxs;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__main {
    flex: 1;
    min-height: 0;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }
}
</style>
