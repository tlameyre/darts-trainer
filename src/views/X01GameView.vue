<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useX01 } from '../composables/useX01.js'
import { saveX01Session } from '../store/dbStore.js'
import X01StatsCard from '../components/x01/X01StatsCard.vue'
import X01DartSlots from '../components/x01/X01DartSlots.vue'
import X01BottomBar from '../components/x01/X01BottomBar.vue'
import X01Result from '../components/x01/X01Result.vue'
import X01DoublesModal from '../components/x01/X01DoublesModal.vue'
import X01CheckoutModal from '../components/x01/X01CheckoutModal.vue'
import WarmupGrid from '../components/warmup/WarmupGrid.vue'
import AnswerInput from '../components/AnswerInput.vue'
import NumPad from '../components/NumPad.vue'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()

if (!gameSettings.value) router.replace({ name: 'x01-settings' })

const settings = gameSettings.value ?? { startScore: 501, legsToWin: 2 }

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

// ── Mode de saisie ────────────────────────────────────────────────────────────
const inputMode  = ref('dart') // 'dart' | 'volley'
const volleyStr  = ref('')     // saisie en cours (mode volée)

function toggleMode() {
  if (isLocked.value) return
  inputMode.value = inputMode.value === 'dart' ? 'volley' : 'dart'
  volleyStr.value = ''
}

function appendDigit(d) {
  if (volleyStr.value.length >= 3) return
  const next = volleyStr.value + d
  if (Number(next) > 180) return
  volleyStr.value = next
}

function deleteDigit() {
  volleyStr.value = volleyStr.value.slice(0, -1)
}

function submitVolley() {
  if (!volleyStr.value) return
  const total = Number(volleyStr.value)
  volleyStr.value = ''
  confirmVolleyTotal(total)
}

function handleUndo() {
  if (inputMode.value === 'volley' && volleyStr.value.length > 0) {
    deleteDigit()
  } else {
    undo()
  }
}

// ── État dérivé ───────────────────────────────────────────────────────────────
const isBust   = computed(() => phase.value === 'bust')
const isLocked = computed(() => phase.value !== 'playing' || volleyCompleting.value)

// Sauvegarde à la fin de la partie
watch(phase, async (val) => {
  if (val === 'game-over' && stats.value) {
    await saveX01Session({
      startScore: settings.startScore,
      legsPlayed: completedLegs.value.length,
      stats:      stats.value,
      settings,
    })
  }
})

// Dernière manche terminée (pour le récap)
const lastLeg = computed(() => completedLegs.value[completedLegs.value.length - 1])
</script>

<template>
  <div class="x01">

    <header class="x01__header">
      <button class="x01__header-btn" @click="router.push({ name: 'x01-settings' })">
        <AppIcon name="exit" :width="22" :height="22" />
      </button>
      <h1 class="x01__header-title">{{ settings.startScore }}</h1>
      <button class="x01__header-btn" @click="handleUndo">
        <AppIcon name="undo" :width="22" :height="22" />
      </button>
    </header>

    <!-- ── Jeu + Bust ────────────────────────────────────────────────────── -->
    <div v-if="phase === 'playing' || isBust" class="x01__game">
      <X01StatsCard
        class="x01__stats-card"
        :remaining="legRemaining"
        :leg-number="legNumber"
        :legs-to-win="settings.legsToWin"
        :volley-number="volleyNumber"
        :volleys="volleys"
        :current-darts="isBust ? [] : currentDarts"
      />

      <div class="x01__game-main">

        <!-- ── Mode fléchette par fléchette ──────────────────────────────── -->
        <template v-if="inputMode === 'dart'">
          <X01DartSlots
            :darts="isBust ? (volleys[volleys.length - 1]?.darts ?? []) : currentDarts"
            :volley-number="isBust ? volleyNumber - 1 : volleyNumber"
            :bust="isBust"
            :input-mode="inputMode"
            @toggle-mode="toggleMode"
          />
          <WarmupGrid :locked="isLocked" @dart="addDart" />
          <X01BottomBar
            :locked="isLocked"
            @undo="handleUndo"
            @miss="addMiss"
            @quit="router.push({ name: 'x01-settings' })"
          />
        </template>

        <!-- ── Mode volée totale ──────────────────────────────────────────── -->
        <template v-else>
          <!-- Ligne de tour + toggle -->
          <div class="x01__volley-row">
            <span class="x01__volley-label">TOUR {{ isBust ? volleyNumber - 1 : volleyNumber }}</span>
            <button class="x01__volley-toggle" :disabled="isBust" @click="toggleMode">
              <AppIcon name="dartboard" :width="16" :height="16" />
              <span>Fléchette / fléchette</span>
            </button>
          </div>

          <!-- Input : normal ou bust -->
          <AnswerInput
            v-if="!isBust"
            :value="volleyStr"
            placeholder="Score de la volée"
            @validate="submitVolley"
          />
          <div v-else class="x01__bust-input">BUST !</div>

          <NumPad
            class="x01__numpad"
            @digit="appendDigit"
            @delete="deleteDigit"
            @validate="submitVolley"
          />
          <X01BottomBar
            :locked="isLocked"
            :bust-mode="true"
            @undo="handleUndo"
            @bust="bustVolley"
            @quit="router.push({ name: 'x01-settings' })"
          />
        </template>

      </div>
    </div>

    <!-- ── Récap entre manches ────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'leg-recap'" class="x01__overlay">
        <div class="x01__recap">
          <div class="x01__recap-emoji">🎯</div>
          <h2 class="x01__recap-title">Manche terminée !</h2>

          <div class="x01__recap-stats">
            <div class="x01__recap-stat">
              <span class="x01__recap-stat-val">{{ lastLeg?.totalDarts }}</span>
              <span class="x01__recap-stat-lbl">fléchettes</span>
            </div>
            <div class="x01__recap-stat">
              <span class="x01__recap-stat-val">{{ lastLeg?.checkoutScore }}</span>
              <span class="x01__recap-stat-lbl">finish</span>
            </div>
            <div class="x01__recap-stat">
              <span class="x01__recap-stat-val">
                {{ lastLeg?.volleys.filter(v => !v.bust).length }}
              </span>
              <span class="x01__recap-stat-lbl">volées valides</span>
            </div>
          </div>

          <div class="x01__recap-volleys">
            <span
              v-for="(v, i) in lastLeg?.volleys"
              :key="i"
              class="x01__recap-chip"
              :class="{ 'x01__recap-chip--bust': v.bust }"
            >
              {{ v.bust ? 'BUST' : v.score }}
            </span>
          </div>

          <button class="x01__recap-next" @click="startNextLeg">
            Manche suivante →
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Modal : doubles tentés ────────────────────────────────────────── -->
    <X01DoublesModal :show="pendingDoublesPrompt" @confirm="confirmDoublesAttempted" />

    <!-- ── Modal : checkout ──────────────────────────────────────────────── -->
    <X01CheckoutModal
      :show="!!pendingCheckout"
      :default-darts="pendingCheckout?.defaultDarts ?? 3"
      :checkout-score="pendingCheckout?.checkoutScore ?? 0"
      @confirm="confirmCheckout"
    />

    <!-- ── Résultats finaux ───────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'game-over'" class="x01__overlay x01__overlay--result">
        <X01Result
          :stats="stats"
          :legs-played="completedLegs.length"
          :start-score="settings.startScore"
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
  max-width: 420px;
  margin: 0 auto;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__header-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s;
    &:active { opacity: 0.6; }
  }

  &__header-title {
    @include title-sm;
    color: $text-color;
    text-align: center;
  }

  &__game {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__game-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  // ── Ligne toggle (mode volée) ──────────────────────────────────────────
  &__volley-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  &__volley-label {
    @include title-md;
  }

  &__volley-toggle {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $muted;
    background: rgba($white, 0.1);
    border-radius: $radius-pill;
    padding: 3px 10px 3px 8px;
    transition: opacity 0.15s;

    &:active  { opacity: 0.6; }
    &:disabled { opacity: 0.3; }
  }

  // Placeholder bust en mode volée
  &__bust-input {
    background: $error;
    border-radius: $radius-pill;
    padding: $padding-sm $padding-xl;
    font-family: $font-title;
    font-weight: 700;
    font-size: 22px;
    color: $white;
    text-align: center;
    letter-spacing: 0.08em;
    flex-shrink: 0;
  }

  // NumPad : prend tout l'espace restant comme WarmupGrid
  &__numpad {
    flex: 1;
    min-height: 0;
    border-top: $border-md solid $white;
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

  &__recap-emoji { font-size: 56px; line-height: 1; }

  &__recap-title {
    @include title-xl;
    font-size: 28px;
    color: $white;
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
    font-family: $font-title;
    font-weight: 700;
    font-size: 36px;
    color: $white;
    line-height: 1;
  }

  &__recap-stat-lbl {
    font-size: 12px;
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
    font-family: $font-title;
    font-size: 14px;
    font-weight: 700;
    color: $white;

    &--bust {
      background: rgba($error, 0.2);
      color: $error-light;
    }
  }

  &__recap-next {
    width: 100%;
    background: $orange;
    border-radius: $radius-sm;
    padding: $padding-md;
    font-family: $font-title;
    font-weight: 700;
    font-size: $title-md;
    text-transform: uppercase;
    color: $white;
    transition: opacity 0.15s;
    &:active { opacity: 0.8; }
  }
}

@media (min-width: $bp-laptop) {
  .x01 {
    max-width: none;
    padding: $padding-xxl;
  }
  .x01__game {
    flex-direction: row;
    align-items: stretch;
  }
  .x01__stats-card { flex: 1; min-height: 50%; }
  .x01__game-main  { flex: 1; margin: auto; }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from   { transform: translateY(40px); opacity: 0; }
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
