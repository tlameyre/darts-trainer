<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDarts } from '../composables/useDarts.js'
import { useGameStore } from '../store/gameStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'

import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import AnswerInput from '../components/AnswerInput.vue'
import NumPad from '../components/NumPad.vue'
import GameOver from '../components/GameOver.vue'
import GameTourRow from '../components/game/GameTourRow.vue'
import GameRoundCard from '../components/game/GameRoundCard.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'

const route      = useRoute()
const router     = useRouter()
const gameStore  = useGameStore()
const dbStore    = useDbStore()
const badgeStore = useBadgeStore()

const {
  currentScore, currentVolee, inputValue,
  feedbackState, streak, best,
  correctCount, questionIndex, gameOver, timeLeft,
  phase, voleeTotal,
  correctAnswer, questionLabel, phaseLabel,
  nextRound, appendDigit, deleteDigit, validate, cleanup,
} = useDarts(gameStore.gameSettings)

watch(gameOver, async (val) => {
  if (val) {
    await dbStore.saveGameSession({
      correctCount:   correctCount.value,
      totalQuestions: questionIndex.value,
      bestStreak:     best.value,
      settings:       gameStore.gameSettings,
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

const showMenu      = ref(false)
const newBadges     = ref([])

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
  <div class="game" :class="{ gameOver: gameOver }">
    <AppHeader :title="gameOver ? 'FIN DE PARTIE' : 'ENTRAINEMENT'" @back="router.push({ name: 'score-settings' })">
      <template v-if="!gameOver" #right>
        <button class="game__menu-btn" @click="showMenu = true">
          <AppIcon name="gear" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <main class="game__main">
      <GameOver v-if="gameOver" :correct-count="correctCount"
        :max-questions="gameStore.gameSettings.maxQuestions ?? questionLabel" :best="best"
        @replay="router.push({ name: 'score-game', query: { t: Date.now() } })"
        @home="router.push({ name: 'play' })" />

      <template v-else>
        <GameRoundCard :phase="phase" :current-score="currentScore" :current-volee="currentVolee"
          :volee-total="voleeTotal" :feedback-state="feedbackState" :correct-answer="correctAnswer"
          :show-value="gameStore.gameSettings.showDartValue" />

        <div class="game__side">
          <GameTourRow :question-label="questionLabel" :phase="phase" :show-phase="gameStore.gameSettings.doubleValidation"
            :time-left="timeLeft" :show-timer="!!gameStore.gameSettings.timeLimit" :is-urgent="timeLeft <= 5" />

          <AnswerInput :value="inputValue" :placeholder="phaseLabel"
            :has-error="feedbackState === 'wrong' || feedbackState === 'timeout'" @validate="validate" />

          <NumPad @digit="appendDigit" @delete="deleteDigit" @validate="validate" />
        </div>
      </template>
    </main>

    <GameMenuModal :show="showMenu" @close="showMenu = false" @finish="finishGame" @quit="quitGame" />
    <BadgeUnlockOverlay :badges="newBadges" @done="newBadges = []" />
  </div>
</template>

<style lang="scss" scoped>
.game {
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: $padding-md;
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
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__side {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    min-height: 0;
    flex: 1;
  }
}

@media (min-width: $bp-laptop) {
  .game {
    padding: $padding-xl;

    &__main {
      flex-direction: row;
      align-items: stretch;
    }

    &__side {
      flex: 1;
    }
  }
}
</style>
