<script setup>
import { computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useX01 } from '../composables/useX01.js'
import { useX01AIOpponent } from '../composables/useX01AIOpponent.js'
import { useDbStore } from '../store/dbStore.js'
import DartSlotsHeader from '../components/game/DartSlotsHeader.vue'
import GameInput from '../components/game/GameInput.vue'
import X01Result from '../components/x01/X01Result.vue'
import X01LegRecap from '../components/x01/X01LegRecap.vue'
import X01DoublesModal from '../components/x01/X01DoublesModal.vue'
import X01CheckoutModal from '../components/x01/X01CheckoutModal.vue'
import X01PlayerSplitCard from '../components/x01/X01PlayerSplitCard.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import AppIcon from '../components/AppIcon.vue'
import AppHeader from '../components/AppHeader.vue'

const router    = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const dbStore   = useDbStore()

if (!gameStore.gameSettings) router.replace({ name: 'x01-settings' })

const settings  = gameStore.gameSettings ?? { startScore: 501, legsToWin: 2 }
const aiProfile = settings.aiProfile ?? null

const {
  completedLegs,
  volleys,
  currentDarts,
  phase,
  legRemaining,
  volleyNumber,
  volleyCompleting,
  pendingDoublesPrompt,
  pendingCheckout,
  addDart,
  addMiss,
  undo,
  confirmVolleyTotal,
  bustVolley,
  confirmDoublesAttempted,
  confirmCheckout,
  startNextLeg,
  addLostLegVolleys,
  stats,
  liveAvgVolley,
} = useX01(settings)

const {
  aiRemaining,
  aiLegsWon,
  aiLastVolley,
  aiTurn,
  aiWonLeg,
  aiWonGame,
  aiVolleysScores,
  aiLegHumanSnapshot,
  aiCardData,
  handleAILegContinue,
} = useX01AIOpponent({
  aiProfile,
  settings,
  volleys,
  phase,
  legRemaining,
  pendingDoublesPrompt,
  pendingCheckout,
  startNextLeg,
})

const AI_VOLLEY_BUCKETS = ['180', '160', '140', '120', '100', '80', '60', '40']

const aiStats = computed(() => {
  if (!aiProfile || !aiVolleysScores.value.length) return null
  const scores = aiVolleysScores.value
  const dist = Object.fromEntries(AI_VOLLEY_BUCKETS.map(k => [k, 0]))
  for (const s of scores) {
    if (s >= 180)      dist['180']++
    else if (s >= 160) dist['160']++
    else if (s >= 140) dist['140']++
    else if (s >= 120) dist['120']++
    else if (s >= 100) dist['100']++
    else if (s >= 80)  dist['80']++
    else if (s >= 60)  dist['60']++
    else if (s >= 40)  dist['40']++
  }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return {
    avgVolley:          parseFloat(avg.toFixed(2)),
    highestVolley:      Math.max(...scores),
    doublesHit:         aiLegsWon.value,
    volleyDistribution: dist,
  }
})

const isBust   = computed(() => phase.value === 'bust')
const isLocked = computed(() => phase.value !== 'playing' || volleyCompleting.value)
const showMenu = ref(false)

function finishGame() {
  showMenu.value = false
  phase.value    = 'game-over'
}

function quitGame() {
  showMenu.value = false
  router.push({ name: 'x01-settings' })
}

// Accumule les volées des manches perdues pour les inclure dans les stats
watch(aiWonLeg, (val) => {
  if (val && aiLegHumanSnapshot.value?.volleys?.length) {
    addLostLegVolleys(aiLegHumanSnapshot.value.volleys)
  }
})

// ── Sauvegarde en fin de partie ───────────────────────────────────────────
watch(phase, async (val) => {
  if (val === 'game-over' && stats.value) {
    const humanLegsWon = Math.max(0, completedLegs.value.length - (aiProfile ? aiLegsWon.value : 0))
    await dbStore.saveX01Session({
      startScore: settings.startScore,
      legsPlayed: completedLegs.value.length,
      stats:      stats.value,
      settings: {
        ...settings,
        humanName:    authStore.profile?.username ?? null,
        humanLegsWon,
        ...(aiProfile ? {
          aiLegsWon:   aiLegsWon.value,
          aiAvgVolley: aiCardData.value.avgVolley,
        } : {}),
      },
    })
  }
})

// ── Données carte joueurs ─────────────────────────────────────────────────
const lastHumanDarts = computed(() => {
  const last = volleys.value[volleys.value.length - 1]
  return last ? last.darts : []
})

const humanTotalDarts = computed(() =>
  volleys.value.reduce((sum, v) => sum + v.darts.length, 0)
  + (isBust.value ? 0 : currentDarts.value.length)
)

const humanLastScore = computed(() => {
  const valid = volleys.value.filter(v => !v.bust)
  return valid.length ? valid[valid.length - 1].score : null
})

const humanCardData = computed(() => ({
  name:       authStore.profile?.username ?? 'Toi',
  remaining:  legRemaining.value,
  legsWon:    completedLegs.value.length,
  legsToWin:  settings.legsToWin,
  lastDarts:  lastHumanDarts.value,
  avgVolley:  liveAvgVolley.value,
  lastScore:  humanLastScore.value,
  totalDarts: humanTotalDarts.value,
}))

const currentVolleyDarts = computed(() =>
  isBust.value
    ? (volleys.value[volleys.value.length - 1]?.darts ?? [])
    : currentDarts.value
)

// ── Données récap de manche ───────────────────────────────────────────────
const showLegRecap = computed(() => phase.value === 'leg-recap' || aiWonLeg.value)
const legWinner    = computed(() => aiWonLeg.value ? 'ai' : 'human')
const lastLeg      = computed(() => completedLegs.value[completedLegs.value.length - 1])

const recapVolleys = computed(() =>
  legWinner.value === 'ai'
    ? (aiLegHumanSnapshot.value?.volleys ?? [])
    : (lastLeg.value?.volleys ?? [])
)

const recapTotalDarts = computed(() =>
  legWinner.value === 'ai'
    ? recapVolleys.value.reduce((sum, v) => sum + v.darts.length, 0)
    : (lastLeg.value?.totalDarts ?? 0)
)

function startNextLegWithAI() {
  aiRemaining.value = settings.startScore
  startNextLeg()
}
</script>

<template>
  <div class="x01">

    <AppHeader :title="String(settings.startScore)" back-icon="exit" @back="router.push({ name: 'x01-settings' })">
      <template v-if="phase !== 'game-over'" #right>
        <button class="x01__menu-btn" @click="showMenu = true">
          <AppIcon name="gear" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <!-- ── Jeu ────────────────────────────────────────────────────────────── -->
    <div v-if="phase === 'playing' || isBust" class="x01__game">

      <div class="x01__game-left">
        <X01PlayerSplitCard
          :human="humanCardData"
          :ai="aiCardData"
          :active-player="aiTurn ? 'ai' : 'human'"
          :solo="!aiProfile"
        />
      </div>

      <div class="x01__game-main">
        <DartSlotsHeader :tour-number="isBust ? volleyNumber - 1 : volleyNumber">
          <template #right>
            <span class="x01__turn-label" :class="{ 'x01__turn-label--ai': aiTurn }">
              {{ aiTurn ? 'DartBot...' : 'À toi !' }}
            </span>
          </template>
        </DartSlotsHeader>
        <GameInput
          :darts="currentVolleyDarts"
          value-key="label"
          :bust="isBust"
          :locked="isLocked"
          toggleable
          @dart="addDart"
          @miss="addMiss"
          @bust="bustVolley"
          @validate="confirmVolleyTotal"
          @undo="undo"
        />
      </div>
    </div>

    <!-- ── Récap de manche ───────────────────────────────────────────────── -->
    <X01LegRecap
      :show="showLegRecap"
      :leg-winner="legWinner"
      :has-a-i="!!aiProfile"
      :human-remaining="aiLegHumanSnapshot?.remaining ?? legRemaining"
      :ai-remaining="aiRemaining"
      :total-darts="recapTotalDarts"
      :checkout-score="lastLeg?.checkoutScore ?? null"
      :ai-darts-used="aiLastVolley?.dartsUsed ?? null"
      :volleys="recapVolleys"
      @next="legWinner === 'ai' ? handleAILegContinue() : startNextLegWithAI()"
    />

    <!-- ── Modales ────────────────────────────────────────────────────────── -->
    <GameMenuModal :show="showMenu" @close="showMenu = false" @finish="finishGame" @quit="quitGame" />
    <X01DoublesModal :show="pendingDoublesPrompt" @confirm="confirmDoublesAttempted" />
    <X01CheckoutModal
      :show="!!pendingCheckout"
      :default-darts="pendingCheckout?.defaultDarts ?? 3"
      :checkout-score="pendingCheckout?.checkoutScore ?? 0"
      @confirm="confirmCheckout"
    />

    <!-- ── Résultats finaux ───────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'game-over'" class="x01__overlay">
        <X01Result
          :stats="stats"
          :legs-played="completedLegs.length"
          :start-score="settings.startScore"
          :ai-won="aiWonGame"
          :ai-legs-won="aiLegsWon"
          :ai-stats="aiStats"
          @replay="router.push({ name: 'x01-settings' })"
          @home="router.push({ name: 'home' })"
        />
      </div>
    </Transition>

  </div>
</template>

<style lang="scss" scoped>
.x01 {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  height: 100dvh;
  overflow: hidden;
  padding: $padding-md;

  &__menu-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__game {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__game-left {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    flex: 1;
    min-height: 0;
  }

  &__game-main {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__turn-label {
    @include title-sm;
    font-weight: 700;
    color: $orange;
    text-transform: uppercase;
    letter-spacing: 0.04em;

    &--ai { color: $muted; }
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: $bg;
    z-index: 90;
    display: flex;
    padding: $padding-md;
  }
}

@media (min-width: $bp-tablet) {
  .x01__game {
    flex-direction: row;
    align-items: stretch;
    gap: $gap-lg;
  }

  .x01__game-left,
  .x01__game-main {
    flex: 1;
  }
}

@media (min-width: $bp-laptop) {
  .x01 {
    padding: $padding-xl;
  }

  .x01__game      { gap: $gap-xl; }
  .x01__turn-label { @include title-md; }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
