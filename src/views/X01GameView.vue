<script setup>
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useX01 } from '../composables/useX01.js'
import { saveX01Session } from '../store/dbStore.js'
import StatsCard from '../components/game/StatsCard.vue'
import DartSlotsHeader from '../components/game/DartSlotsHeader.vue'
import GameInput from '../components/game/GameInput.vue'
import X01Result from '../components/x01/X01Result.vue'
import X01DoublesModal from '../components/x01/X01DoublesModal.vue'
import X01CheckoutModal from '../components/x01/X01CheckoutModal.vue'
import AppIcon from '../components/AppIcon.vue'
import AppHeader from '../components/AppHeader.vue'

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

const isBust = computed(() => phase.value === 'bust')
const isLocked = computed(() => phase.value !== 'playing' || volleyCompleting.value)

watch(phase, async (val) => {
  if (val === 'game-over' && stats.value) {
    await saveX01Session({
      startScore: settings.startScore,
      legsPlayed: completedLegs.value.length,
      stats: stats.value,
      settings,
    })
  }
})

const lastLeg = computed(() => completedLegs.value[completedLegs.value.length - 1])

const totalDarts = computed(() =>
  volleys.value.reduce((sum, v) => sum + v.darts.length, 0)
  + (isBust.value ? 0 : currentDarts.value.length)
)

const avgVolley = computed(() => {
  const valid = volleys.value.filter(v => !v.bust)
  if (!valid.length) return '–'
  return Math.round(valid.reduce((s, v) => s + v.score, 0) / valid.length)
})

const statsRows = computed(() => [
  { label: 'Manche', value: `${Math.min(legNumber.value, settings.legsToWin)} / ${settings.legsToWin}` },
  { label: 'Fléchettes lancées', value: totalDarts.value },
  { label: 'Moy. volée', value: avgVolley.value },
])

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
      <StatsCard class="x01__stats-card" color="#047857" :rows="statsRows">
        {{ legRemaining }}
      </StatsCard>

      <div class="x01__game-main">
        <DartSlotsHeader :tour-number="isBust ? volleyNumber - 1 : volleyNumber" />
        <GameInput :darts="currentVolleyDarts" value-key="label" :bust="isBust" :locked="isLocked" toggleable
          @dart="addDart" @miss="addMiss" @bust="bustVolley" @validate="confirmVolleyTotal" @undo="undo" />
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
              <span class="x01__recap-stat-val">{{lastLeg?.volleys.filter(v => !v.bust).length}}</span>
              <span class="x01__recap-stat-lbl">volées valides</span>
            </div>
          </div>

          <div class="x01__recap-volleys">
            <span v-for="(v, i) in lastLeg?.volleys" :key="i" class="x01__recap-chip"
              :class="{ 'x01__recap-chip--bust': v.bust }">
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
    <X01CheckoutModal :show="!!pendingCheckout" :default-darts="pendingCheckout?.defaultDarts ?? 3"
      :checkout-score="pendingCheckout?.checkoutScore ?? 0" @confirm="confirmCheckout" />

    <!-- ── Résultats finaux ───────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'game-over'" class="x01__overlay x01__overlay--result">
        <X01Result :stats="stats" :legs-played="completedLegs.length" :start-score="settings.startScore"
          @replay="router.push({ name: 'x01-game', query: { t: Date.now() } })" @home="router.push({ name: 'play' })" />
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

  &__game-main {
    flex: 1;
    min-height: 0;
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

  &__recap-emoji {
    @include display-sm;
    line-height: 1;
  }

  &__recap-title {
    @include title-xxl;
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

@media (min-width: $bp-laptop) {
  .x01 {
    padding: $padding-xl;
  }

  .x01__game {
    flex-direction: row;
    align-items: stretch;
  }

  .x01__stats-card {
    flex: 1;
  }

  .x01__game-main {
    flex: 1;
  }

  .x01__recap-emoji { @include display-md; }
  .x01__recap-title { @include title-xxxl; }
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
