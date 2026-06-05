<script setup>
import { computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useX01 } from '../composables/useX01.js'
import { useDbStore } from '../store/dbStore.js'
import { simulateAIVolley } from '../composables/useX01AI.js'
import DartSlotsHeader from '../components/game/DartSlotsHeader.vue'
import GameInput from '../components/game/GameInput.vue'
import X01Result from '../components/x01/X01Result.vue'
import X01DoublesModal from '../components/x01/X01DoublesModal.vue'
import X01CheckoutModal from '../components/x01/X01CheckoutModal.vue'
import X01PlayerSplitCard from '../components/x01/X01PlayerSplitCard.vue'
import AppIcon from '../components/AppIcon.vue'
import AppHeader from '../components/AppHeader.vue'

const router     = useRouter()
const gameStore  = useGameStore()
const authStore  = useAuthStore()
const dbStore    = useDbStore()

if (!gameStore.gameSettings) router.replace({ name: 'x01-settings' })

const settings   = gameStore.gameSettings ?? { startScore: 501, legsToWin: 2 }
const aiProfile  = settings.aiProfile ?? null

const {
  completedLegs,
  volleys,
  currentDarts,
  phase,
  legRemaining,
  legNumber,
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
  stats,
} = useX01(settings)

const isBust   = computed(() => phase.value === 'bust')
const isLocked = computed(() => phase.value !== 'playing' || volleyCompleting.value)

// ── IA ───────────────────────────────────────────────────────────────────────
const aiRemaining      = ref(settings.startScore)
const aiLegsWon        = ref(0)
const aiLastVolley     = ref(null)
const aiTurn           = ref(false)
const aiPending        = ref(false)  // l'IA attend que les modales soient fermées
const aiWonLeg         = ref(false)  // l'IA a remporté une manche (pas encore la partie)
const aiWonGame        = ref(false)  // l'IA a remporté la partie
const aiTotalDarts     = ref(0)      // total fléchettes IA lancées
const aiVolleysScores  = ref([])     // scores des volées valides IA (pour la moyenne)
let _aiTimer           = null

// Snapshot des volées humaines au moment où l'IA gagne une manche
const aiLegHumanSnapshot = ref(null)

const aiLevel = computed(() => aiProfile?.level ?? null)

const aiAvgVolley = computed(() => {
  if (!aiVolleysScores.value.length) return '–'
  const sum = aiVolleysScores.value.reduce((a, b) => a + b, 0)
  return (sum / aiVolleysScores.value.length).toFixed(2)
})

function triggerAIVolley() {
  aiTurn.value    = true
  aiPending.value = false
  clearTimeout(_aiTimer)
  _aiTimer = setTimeout(() => {
    const result = simulateAIVolley(aiRemaining.value, aiProfile)
    aiLastVolley.value = result

    aiTotalDarts.value += result.dartsUsed
    if (!result.bust) aiVolleysScores.value.push(result.score)

    if (result.isCheckout) {
      aiRemaining.value = 0
      aiLegsWon.value  += 1
      aiTurn.value      = false
      if (aiLegsWon.value >= settings.legsToWin) {
        aiWonGame.value = true
        // Capturer l'état humain avant de passer en game-over
        aiLegHumanSnapshot.value = {
          volleys:   [...volleys.value],
          remaining: legRemaining.value,
        }
        phase.value = 'game-over'
      } else {
        // Capturer les volées humaines avant le reset pour l'affichage du récap
        aiLegHumanSnapshot.value = {
          volleys:   [...volleys.value],
          remaining: legRemaining.value,
        }
        aiWonLeg.value = true
      }
    } else {
      aiRemaining.value = Math.max(0, aiRemaining.value - result.score)
      aiTurn.value      = false
    }
  }, 900)
}

function handleAILegContinue() {
  aiWonLeg.value           = false
  aiLegHumanSnapshot.value = null
  aiRemaining.value        = settings.startScore
  startNextLeg()
}

function resetAILegStats() {
  // Ne remet pas à zéro aiTotalDarts ni aiVolleysScores — la moyenne est cumulative sur toute la partie
}

// L'IA joue après chaque volée humaine — mais attend si une modale ou un bust est en cours
watch(() => volleys.value.length, (newLen, oldLen) => {
  if (!aiProfile) return
  if (newLen <= oldLen) return
  if (phase.value === 'leg-recap' || phase.value === 'game-over') return

  if (phase.value === 'bust' || pendingDoublesPrompt.value || pendingCheckout.value) {
    aiPending.value = true
    return
  }
  triggerAIVolley()
})

// Bust terminé → phase repasse à 'playing'
watch(phase, (val, old) => {
  if (!aiProfile) return
  if (val === 'playing' && old === 'bust' && aiPending.value) {
    // Si une modale s'ouvre juste après le bust (checkout zone), on laisse son watch prendre le relais
    if (pendingDoublesPrompt.value || pendingCheckout.value) return
    triggerAIVolley()
  }
})

// Déclenche le tour IA dès que la modale doubles est fermée
watch(pendingDoublesPrompt, (val) => {
  if (!aiProfile || val) return
  if (aiPending.value && phase.value === 'playing') triggerAIVolley()
})

// Déclenche le tour IA dès que la modale checkout est fermée
watch(pendingCheckout, (val) => {
  if (!aiProfile || val) return
  if (aiPending.value && phase.value === 'playing') triggerAIVolley()
})

// Reset IA au démarrage de chaque manche (quand le joueur humain remporte une manche)
function startNextLegWithAI() {
  aiRemaining.value = settings.startScore
  resetAILegStats()
  startNextLeg()
}

watch(phase, async (val) => {
  if (val === 'game-over' && stats.value) {
    await dbStore.saveX01Session({
      startScore: settings.startScore,
      legsPlayed: completedLegs.value.length,
      stats: stats.value,
      settings,
    })
  }
})

const lastLeg       = computed(() => completedLegs.value[completedLegs.value.length - 1])
const showLegRecap  = computed(() => phase.value === 'leg-recap' || aiWonLeg.value)
const legWinner     = computed(() => aiWonLeg.value ? 'ai' : 'human')

const recapVolleys    = computed(() =>
  legWinner.value === 'ai'
    ? (aiLegHumanSnapshot.value?.volleys ?? [])
    : (lastLeg.value?.volleys ?? [])
)
const recapTotalDarts = computed(() =>
  legWinner.value === 'ai'
    ? recapVolleys.value.reduce((sum, v) => sum + v.darts.length, 0)
    : (lastLeg.value?.totalDarts ?? 0)
)
const recapValidVolleys = computed(() =>
  recapVolleys.value.filter(v => !v.bust).length
)

// ── Données carte joueurs ─────────────────────────────────────────────────
const lastHumanDarts = computed(() => {
  const last = volleys.value[volleys.value.length - 1]
  return last ? last.darts : []
})

const humanTotalDarts = computed(() =>
  volleys.value.reduce((sum, v) => sum + v.darts.length, 0)
  + (isBust.value ? 0 : currentDarts.value.length)
)

const humanAvgVolley = computed(() => {
  const pastValid = completedLegs.value.flatMap(l => l.volleys.filter(v => !v.bust))
  const curValid  = volleys.value.filter(v => !v.bust)
  const all = [...pastValid, ...curValid]
  if (!all.length) return '–'
  return (all.reduce((s, v) => s + v.score, 0) / all.length).toFixed(2)
})

const humanLastScore = computed(() => {
  const validVolleys = volleys.value.filter(v => !v.bust)
  if (!validVolleys.length) return null
  return validVolleys[validVolleys.length - 1].score
})

const humanCardData = computed(() => ({
  name:       authStore.profile?.username ?? 'Toi',
  remaining:  legRemaining.value,
  legsWon:    completedLegs.value.length,
  legsToWin:  settings.legsToWin,
  lastDarts:  lastHumanDarts.value,
  avgVolley:  humanAvgVolley.value,
  lastScore:  humanLastScore.value,
  totalDarts: humanTotalDarts.value,
}))

const aiCardData = computed(() => ({
  profileLabel: aiProfile?.label ?? '',
  level:        aiLevel.value,
  remaining:    aiRemaining.value,
  legsWon:      aiLegsWon.value,
  legsToWin:    settings.legsToWin,
  lastScore:    aiLastVolley.value?.isCheckout ? aiLastVolley.value.score : (aiLastVolley.value?.bust ? null : aiLastVolley.value?.score ?? null),
  avgVolley:    aiAvgVolley.value,
  totalDarts:   aiTotalDarts.value,
  isThinking:   aiTurn.value,
}))

const currentVolleyDarts = computed(() =>
  isBust.value ? (volleys.value[volleys.value.length - 1]?.darts ?? []) : currentDarts.value
)
</script>

<template>
  <div class="x01">

    <AppHeader :title="String(settings.startScore)" back-icon="exit" @back="router.push({ name: 'x01-settings' })">
      <template #right>
        <button class="x01__undo-btn" @click="undo">
          <AppIcon name="undo" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <!-- ── Jeu + Bust ────────────────────────────────────────────────────── -->
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
        <GameInput :darts="currentVolleyDarts" value-key="label" :bust="isBust" :locked="isLocked" toggleable
          @dart="addDart" @miss="addMiss" @bust="bustVolley" @validate="confirmVolleyTotal" @undo="undo" />
      </div>
    </div>

    <!-- ── Récap de manche (humain ou IA) ──────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="showLegRecap" class="x01__overlay">
        <div class="x01__recap">

          <div class="x01__recap-winner" :class="legWinner === 'ai' ? 'x01__recap-winner--ai' : 'x01__recap-winner--human'">
            {{ legWinner === 'ai' ? '🤖 L\'IA a remporté cette manche' : '🎯 Tu as remporté cette manche !' }}
          </div>

          <div v-if="aiProfile" class="x01__recap-score-line">
            <span>
              Toi : <strong>{{ legWinner === 'human' ? 0 : (aiLegHumanSnapshot?.remaining ?? legRemaining) }}</strong>
            </span>
            <span>·</span>
            <span>
              IA : <strong>{{ legWinner === 'ai' ? 0 : aiRemaining }}</strong>
            </span>
          </div>

          <div class="x01__recap-stats">
            <div class="x01__recap-stat">
              <span class="x01__recap-stat-val">{{ recapTotalDarts }}</span>
              <span class="x01__recap-stat-lbl">fléchettes</span>
            </div>
            <div v-if="legWinner === 'human'" class="x01__recap-stat">
              <span class="x01__recap-stat-val">{{ lastLeg?.checkoutScore }}</span>
              <span class="x01__recap-stat-lbl">finish</span>
            </div>
            <div v-if="legWinner === 'ai'" class="x01__recap-stat">
              <span class="x01__recap-stat-val">{{ aiLastVolley?.dartsUsed ?? '–' }}</span>
              <span class="x01__recap-stat-lbl">fléchettes IA</span>
            </div>
            <div class="x01__recap-stat">
              <span class="x01__recap-stat-val">{{ recapValidVolleys }}</span>
              <span class="x01__recap-stat-lbl">volées valides</span>
            </div>
          </div>

          <div class="x01__recap-volleys">
            <span v-for="(v, i) in recapVolleys" :key="i" class="x01__recap-chip"
              :class="{ 'x01__recap-chip--bust': v.bust }">
              {{ v.bust ? 'BUST' : v.score }}
            </span>
          </div>

          <button class="x01__recap-next" @click="legWinner === 'ai' ? handleAILegContinue() : startNextLegWithAI()">
            Manche suivante →
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Modal : doubles tentés ────────────────────────────────────────── -->
    <X01DoublesModal :show="pendingDoublesPrompt" @confirm="confirmDoublesAttempted" />

    <!-- ── Modal : checkout ──────────────────────────────────────────────── -->
    <X01CheckoutModal :show="!!pendingCheckout" :default-darts="pendingCheckout?.defaultDarts ?? 3"
      :checkout-score="pendingCheckout?.checkoutScore ?? 0" @confirm="confirmCheckout" />

    <!-- ── Résultats finaux ───────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'game-over'" class="x01__overlay x01__overlay--result">
        <X01Result
          :stats="stats"
          :legs-played="completedLegs.length"
          :start-score="settings.startScore"
          :ai-won="aiWonGame"
          :ai-legs-won="aiLegsWon"
          @replay="router.push({ name: 'x01-game', query: { t: Date.now() } })"
          @home="router.push({ name: 'play' })"
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

  &__undo-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    transition: opacity 0.15s;

    &:active {
      opacity: 0.6;
    }
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

  &__turn-label {
    @include title-sm;
    font-weight: 700;
    color: $orange;
    text-transform: uppercase;
    letter-spacing: 0.04em;

    &--ai { color: $muted; }
  }

  &__game-main {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  // ── Overlays ──────────────────────────────────────────────────────────
  &__overlay {
    position: fixed;
    inset: 0;
    background: $bg;
    z-index: 90;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $padding-xl $padding-md;

    &--result {
      align-items: flex-start;
      overflow-y: auto;
      padding-bottom: calc($padding-xxl + 16px);
    }
  }

  // ── Récap ─────────────────────────────────────────────────────────────
  &__recap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-lg;
    width: 100%;
    max-width: 380px;
  }

  &__recap-winner {
    @include title-lg;
    font-weight: 700;
    color: $white;
    text-align: center;

    &--ai    { color: $orange; }
    &--human { color: $accent; }
  }

  &__recap-score-line {
    display: flex;
    gap: $gap-sm;
    align-items: center;
    @include text-sm;
    color: $muted;

    strong { color: $white; }
  }

  &__recap-stats {
    display: flex;
    gap: $gap-xl;
    justify-content: center;
  }

  &__recap-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__recap-stat-val {
    @include display-xs;
    font-weight: 700;
    color: $white;
    line-height: 1;
  }

  &__recap-stat-lbl {
    @include title-xs;
    color: $muted;
    text-align: center;
  }

  &__recap-volleys {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs;
    justify-content: center;
  }

  &__recap-chip {
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    padding: 5px 14px;
    @include title-sm;
    font-weight: 700;
    color: $white;

    &--bust {
      background: rgba($error, 0.2);
      color: $error-light;
    }
  }

  &__recap-score-line strong { color: $white; }

  &__recap-next {
    width: 100%;
    background: $orange;
    border-radius: $radius-sm;
    padding: $padding-md;
    @include title-md;
    font-weight: 700;
    text-transform: uppercase;
    color: $white;
    transition: opacity 0.15s;

    &:active {
      opacity: 0.8;
    }
  }
}

@media (min-width: $bp-tablet) {
  .x01__game {
    flex-direction: row;
    align-items: stretch;
    gap: $gap-lg;
  }

  .x01__game-left {
    flex: 1;
  }

  .x01__game-main {
    flex: 1;
  }
}

@media (min-width: $bp-laptop) {
  .x01 {
    padding: $padding-xl;
  }

  .x01__game {
    gap: $gap-xl;
  }

  .x01__turn-label {
    @include title-md;
  }

  .x01__recap-winner { @include title-xl; }
  .x01__recap-stat-val { @include display-sm; }
  .x01__recap-stat-lbl { @include title-sm; }
  .x01__recap-chip { @include title-md; }
  .x01__recap-next { @include title-lg; }
}

.slide-up-enter-active {
  transition: transform 0.3s ease, opacity 0.3s;
}

.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.2s;
}

.slide-up-enter-from {
  transform: translateY(40px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(40px);
  opacity: 0;
}
</style>
