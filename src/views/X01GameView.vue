<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useX01 } from '../composables/useX01.js'
import { saveX01Session } from '../store/dbStore.js'
import X01DartSlots from '../components/x01/X01DartSlots.vue'
import X01BottomBar from '../components/x01/X01BottomBar.vue'
import X01Result from '../components/x01/X01Result.vue'
import WarmupGrid from '../components/warmup/WarmupGrid.vue'

const router = useRouter()

if (!gameSettings.value) router.replace({ name: 'x01-settings' })

const settings = gameSettings.value ?? { startScore: 501, legsToWin: 2 }

const {
  completedLegs,
  volleys,
  currentDarts,
  phase,
  legRemaining,
  displayRemaining,
  legNumber,
  volleyNumber,
  addDart,
  addMiss,
  undo,
  startNextLeg,
  stats,
} = useX01(settings)

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

// Couleur du score restant : ambre si checkout possible (≤ 170), blanc sinon
const scoreColor = computed(() => {
  if (legRemaining.value <= 170) return '#f59e0b'
  return '#ffffff'
})

// Dernière manche terminée (pour le récap)
const lastLeg = computed(() => completedLegs.value[completedLegs.value.length - 1])

// Historique des volées de la manche courante (pour affichage sous les slots)
const legVolleys = computed(() => volleys.value)

const isBust   = computed(() => phase.value === 'bust')
const isLocked = computed(() => phase.value !== 'playing')
</script>

<template>
  <div class="x01">

    <!-- ── En jeu ──────────────────────────────────────────────────────── -->
    <template v-if="phase === 'playing' || phase === 'bust'">

      <!-- Score restant -->
      <div class="x01__score-area">
        <div class="x01__remaining" :style="{ color: scoreColor }">
          {{ displayRemaining }}
        </div>
        <div v-if="legRemaining <= 170" class="x01__checkout-hint">
          Checkout possible
        </div>
      </div>

      <!-- Historique des volées de la manche -->
      <div class="x01__history">
        <span
          v-for="(v, i) in legVolleys"
          :key="i"
          class="x01__history-chip"
          :class="{ 'x01__history-chip--bust': v.bust }"
        >
          {{ v.bust ? 'BUST' : v.score }}
        </span>
        <span v-if="!legVolleys.length" class="x01__history-empty">–</span>
      </div>

      <!-- Slots fléchettes courantes -->
      <X01DartSlots
        :darts="currentDarts"
        :volley-number="volleyNumber"
        :leg-number="legNumber"
        :legs-to-win="settings.legsToWin"
        :remaining="displayRemaining"
        :bust="isBust"
      />

      <!-- Grille de saisie (réutilisée du warmup) -->
      <WarmupGrid :locked="isLocked" @dart="addDart" />

      <!-- Barre du bas -->
      <X01BottomBar :locked="isLocked" @undo="undo" @miss="addMiss" @quit="router.push({ name: 'x01-settings' })" />

    </template>

    <!-- ── Récap entre manches ─────────────────────────────────────────── -->
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

          <!-- Détail des volées -->
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

    <!-- ── Résultats finaux ────────────────────────────────────────────── -->
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
  height: 100dvh;
  overflow: hidden;
  padding: $padding-md;
  max-width: 420px;
  margin: 0 auto;
  gap: $gap-md;

  // ── Score restant ─────────────────────────────────────────────────────────
  &__score-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    gap: $gap-xxs;
  }

  &__remaining {
    font-family: $font-title;
    font-weight: 700;
    font-size: 72px;
    line-height: 1;
    transition: color 0.3s;
    font-variant-numeric: tabular-nums;
  }

  &__checkout-hint {
    font-size: 12px;
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  // ── Historique des volées ─────────────────────────────────────────────────
  &__history {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs;
    justify-content: center;
    min-height: 28px;
    flex-shrink: 0;
  }

  &__history-chip {
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    padding: 3px 10px;
    font-family: $font-title;
    font-size: 13px;
    font-weight: 700;
    color: $white;

    &--bust {
      background: rgba($error, 0.2);
      color: $error-light;
    }
  }

  &__history-empty {
    font-size: 13px;
    color: rgba($white, 0.25);
    align-self: center;
  }

  // ── Overlay (récap + résultats) ───────────────────────────────────────────
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

  // ── Récap inter-manches ───────────────────────────────────────────────────
  &__recap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-lg;
    width: 100%;
    max-width: 380px;
  }

  &__recap-emoji {
    font-size: 56px;
    line-height: 1;
  }

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

// ── Transitions ───────────────────────────────────────────────────────────────
.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from   { transform: translateY(40px); opacity: 0; }
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
