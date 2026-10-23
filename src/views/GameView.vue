<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDarts } from '../composables/useDarts.js'
import { useGameStore } from '../store/gameStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'

import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import ScoreRoundPanel from '../components/score/ScoreRoundPanel.vue'
import ScoreAnswerBox from '../components/score/ScoreAnswerBox.vue'
import ScoreKeypad from '../components/score/ScoreKeypad.vue'
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

watch(gameOver, async (val) => {
  if (val) {
    durationMs.value = startedAt.value ? Date.now() - startedAt.value : 0
    await dbStore.saveGameSession({
      correctCount:   correctCount.value,
      totalQuestions: questionIndex.value,
      bestStreak:     best.value,
      settings,
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
  <div class="game" :class="!gameOver && tone && `game--${tone}`">
    <AppHeader
      :title="gameOver ? 'Fin de partie' : 'Entraînement'"
      :back-icon="gameOver ? 'exit' : 'arrow-left'"
      @back="router.push({ name: 'score-settings' })"
    >
      <template v-if="!gameOver" #right>
        <button class="game__menu-btn" aria-label="Menu de la partie" @click="showMenu = true">
          <AppIcon name="gear" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <ScoreRecap
      v-if="gameOver"
      :history="history"
      :double-validation="settings.doubleValidation"
      :best="best"
      :duration-ms="durationMs"
      @replay="router.push({ name: 'score-settings' })"
      @home="router.push({ name: 'home' })"
    />

    <main v-else class="game__main">
      <ScoreRoundPanel
        class="game__panel"
        :phase="phase"
        :show-phase="settings.doubleValidation"
        :streak="streak"
        :question-index="questionIndex"
        :max-questions="settings.maxQuestions"
        :time-left="timeLeft"
        :show-timer="!!settings.timeLimit"
        :current-score="currentScore"
        :current-volee="currentVolee"
        :volee-total="voleeTotal"
        :show-dart-value="settings.showDartValue"
      />
      <div class="game__answer">
        <ScoreAnswerBox :value="inputValue" :tone="tone" :expected="correctAnswer" />
      </div>
      <ScoreKeypad class="game__keys" @digit="appendDigit" @delete="deleteDigit" @validate="validate" />
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

  &__menu-btn {
    display: flex;
    align-items: center;
    padding: $padding-xxs;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__panel {
    flex: 1;
    padding: $padding-xs $padding-md 0;
    background: $orange;
  }

  &__answer {
    padding: $padding-sm $padding-md $padding-md;
    background: $orange;
  }

  // AppHeader's root carries this view's scope, so its background can be themed here
  .app-header,
  &__panel,
  &__answer {
    transition: background 0.2s;
  }

  &--ok {
    .app-header,
    .game__panel,
    .game__answer {
      background: $accent;
    }
  }

  &--ko {
    .app-header,
    .game__panel,
    .game__answer {
      background: $error;
    }
  }

  &__keys {
    padding: $padding-sm $padding-md $padding-md;
  }
}

@media (min-width: $bp-laptop) {
  .game {
    &__main {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: auto 1fr;
    }

    &__panel {
      grid-row: 1 / 3;
      padding: $padding-xl $padding-xxl $padding-xxl;
    }

    &__answer {
      padding: $padding-xl $padding-xxl $padding-md;
    }

    &__answer,
    &--ok .game__answer,
    &--ko .game__answer {
      background: transparent;
    }

    &__keys {
      padding: 0 $padding-xxl $padding-xxl;
    }
  }
}
</style>
