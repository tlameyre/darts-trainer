<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useX01 } from '../composables/useX01.js'
import { saveX01Session } from '../store/dbStore.js'
import X01Result from '../components/x01/X01Result.vue'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()

if (!gameSettings.value) router.replace({ name: 'x01-settings' })

const settings = gameSettings.value ?? { startScore: 501, legsToWin: 2 }

const {
  completedLegs,
  volleys,
  phase,
  remaining,
  legNumber,
  currentVolleyNumber,
  inputStr,
  inputValue,
  addDigit,
  removeDigit,
  confirmVolley,
  bustDirect,
  undoLast,
  confirmCheckout,
  startNextLeg,
  stats,
} = useX01(settings)

// Couleur du score restant : vert si checkout possible (≤ 170), rouge si <0 impossible
const scoreColor = computed(() => {
  if (remaining.value <= 0) return '#36cc86'
  if (remaining.value <= 170) return '#f59e0b'
  return '#ffffff'
})

// Résumé des volées de la manche courante pour l'affichage
const legVolleys = computed(() => volleys.value)

// Informations de la dernière manche terminée (pour leg-recap)
const lastLeg = computed(() => completedLegs.value[completedLegs.value.length - 1])

async function onGameOver() {
  if (stats.value) {
    await saveX01Session({
      startScore:      settings.startScore,
      legsPlayed:      completedLegs.value.length,
      stats:           stats.value,
      settings,
    })
  }
}

// Sauvegarder quand la partie se termine
import { watch } from 'vue'
watch(phase, (val) => {
  if (val === 'game-over') onGameOver()
})

function quit() {
  router.push({ name: 'x01-settings' })
}
</script>

<template>
  <div class="x01">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="x01__header">
      <button class="x01__header-btn" @click="quit">
        <AppIcon name="exit" :width="22" :height="22" />
      </button>

      <div class="x01__header-center">
        <span class="x01__header-title">{{ settings.startScore }}</span>
        <span class="x01__header-sub">
          Manche {{ Math.min(legNumber, settings.legsToWin) }}/{{ settings.legsToWin }}
        </span>
      </div>

      <button class="x01__header-btn" @click="undoLast" :disabled="volleys.length === 0 && phase === 'playing'">
        <AppIcon name="undo" :width="22" :height="22" />
      </button>
    </header>

    <!-- ── Jeu en cours ────────────────────────────────────────────────── -->
    <template v-if="phase === 'playing' || phase === 'checkout-darts'">

      <!-- Score restant -->
      <div class="x01__score-area">
        <div class="x01__remaining" :style="{ color: scoreColor }">
          {{ remaining }}
        </div>
        <div class="x01__volley-label">Volée {{ currentVolleyNumber }}</div>
      </div>

      <!-- Historique des volées de la manche -->
      <div class="x01__history">
        <div
          v-for="(v, i) in legVolleys"
          :key="i"
          class="x01__history-chip"
          :class="{ 'x01__history-chip--bust': v.bust }"
        >
          {{ v.bust ? 'BUST' : v.score }}
        </div>
        <div v-if="legVolleys.length === 0" class="x01__history-empty">
          Aucune volée encore
        </div>
      </div>

      <!-- Affichage de la saisie -->
      <div class="x01__input-display" :class="{ 'x01__input-display--empty': !inputStr }">
        {{ inputStr || '–' }}
      </div>

      <!-- Pavé numérique -->
      <div class="x01__numpad">
        <div class="x01__numpad-grid">
          <button v-for="d in [7,8,9,4,5,6,1,2,3]" :key="d" class="x01__key" @click="addDigit(d)">
            {{ d }}
          </button>
          <button class="x01__key x01__key--del" @click="removeDigit">
            <AppIcon name="delete" :width="20" :height="20" />
          </button>
          <button class="x01__key" @click="addDigit(0)">0</button>
          <button
            class="x01__key x01__key--ok"
            :disabled="inputValue === null"
            @click="confirmVolley"
          >
            <AppIcon name="check" :width="20" :height="20" />
          </button>
        </div>
        <button class="x01__bust-btn" @click="bustDirect">BUST</button>
      </div>

    </template>

    <!-- ── Modal : combien de fléchettes pour le finish ? ─────────────── -->
    <Transition name="fade">
      <div v-if="phase === 'checkout-darts'" class="x01__overlay">
        <div class="x01__modal">
          <p class="x01__modal-title">Combien de fléchettes pour finir ?</p>
          <div class="x01__modal-darts">
            <button
              v-for="n in [1, 2, 3]"
              :key="n"
              class="x01__modal-dart-btn"
              @click="confirmCheckout(n)"
            >
              {{ n }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Récap entre manches ─────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'leg-recap'" class="x01__recap">
        <div class="x01__recap-inner">
          <div class="x01__recap-emoji">🎯</div>
          <h2 class="x01__recap-title">Manche terminée !</h2>
          <div class="x01__recap-stats">
            <div class="x01__recap-stat">
              <span class="x01__recap-stat-value">{{ lastLeg?.totalDarts }}</span>
              <span class="x01__recap-stat-label">fléchettes</span>
            </div>
            <div class="x01__recap-stat">
              <span class="x01__recap-stat-value">{{ lastLeg?.checkoutScore }}</span>
              <span class="x01__recap-stat-label">finish</span>
            </div>
            <div class="x01__recap-stat">
              <span class="x01__recap-stat-value">{{ lastLeg?.volleys.filter(v => !v.bust).length }}</span>
              <span class="x01__recap-stat-label">volées valides</span>
            </div>
          </div>
          <!-- Détail volées -->
          <div class="x01__recap-volleys">
            <div
              v-for="(v, i) in lastLeg?.volleys"
              :key="i"
              class="x01__recap-chip"
              :class="{ 'x01__recap-chip--bust': v.bust }"
            >
              {{ v.bust ? 'BUST' : v.score }}
            </div>
          </div>
          <button class="x01__recap-next" @click="startNextLeg">
            Manche suivante →
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Résultats finaux ────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'game-over'" class="x01__gameover">
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

  // ── Header ─────────────────────────────────────────────────────────────
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
    padding: $padding-xxs;
    transition: opacity 0.15s;

    &:active  { opacity: 0.6; }
    &:disabled { opacity: 0.25; }
  }

  &__header-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  &__header-title {
    @include title-lg;
    color: $text-color;
    font-size: 20px;
  }

  &__header-sub {
    font-size: 12px;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  // ── Score restant ───────────────────────────────────────────────────────
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
    font-size: 80px;
    line-height: 1;
    transition: color 0.3s;
  }

  &__volley-label {
    font-size: 13px;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  // ── Historique ──────────────────────────────────────────────────────────
  &__history {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs;
    justify-content: center;
    min-height: 32px;
    flex-shrink: 0;
  }

  &__history-chip {
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    padding: 4px 12px;
    font-family: $font-title;
    font-size: 14px;
    font-weight: 700;
    color: $white;

    &--bust {
      background: rgba($error, 0.2);
      color: $error-light;
    }
  }

  &__history-empty {
    font-size: 13px;
    color: rgba($white, 0.3);
    align-self: center;
  }

  // ── Saisie ─────────────────────────────────────────────────────────────
  &__input-display {
    background: rgba($white, 0.06);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-md;
    text-align: center;
    font-family: $font-title;
    font-weight: 700;
    font-size: 36px;
    color: $white;
    padding: $padding-sm $padding-md;
    flex-shrink: 0;
    transition: border-color 0.2s;

    &--empty {
      color: $muted;
    }
  }

  // ── Pavé numérique ─────────────────────────────────────────────────────
  &__numpad {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    flex: 1;
    min-height: 0;
  }

  &__numpad-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $gap-xs;
    flex: 1;
  }

  &__key {
    background: rgba($white, 0.07);
    border-radius: $radius-md;
    font-family: $font-title;
    font-weight: 700;
    font-size: 24px;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s, transform 0.08s;

    &:active {
      background: rgba($white, 0.15);
      transform: scale(0.95);
    }

    &--del {
      background: rgba($white, 0.05);
      color: $muted;
    }

    &--ok {
      background: rgba(#16a34a, 0.25);
      color: #86efac;

      &:disabled {
        opacity: 0.3;
      }

      &:not(:disabled):active {
        background: rgba(#16a34a, 0.45);
      }
    }
  }

  &__bust-btn {
    background: rgba($error, 0.15);
    border-radius: $radius-md;
    font-family: $font-title;
    font-weight: 700;
    font-size: $title-md;
    color: $error-light;
    padding: $padding-sm;
    transition: background 0.15s;
    flex-shrink: 0;

    &:active {
      background: rgba($error, 0.3);
    }
  }

  // ── Overlay : fléchettes checkout ──────────────────────────────────────
  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba($black, 0.7);
    display: flex;
    align-items: flex-end;
    z-index: 100;
    padding: $padding-md;
  }

  &__modal {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    background: #1e2b28;
    border-radius: $radius-lg;
    padding: $padding-xl;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__modal-title {
    @include title-lg;
    color: $white;
    text-align: center;
  }

  &__modal-darts {
    display: flex;
    gap: $gap-sm;
  }

  &__modal-dart-btn {
    flex: 1;
    background: rgba($white, 0.08);
    border-radius: $radius-md;
    padding: $padding-lg;
    font-family: $font-title;
    font-weight: 700;
    font-size: 32px;
    color: $white;
    transition: background 0.15s, transform 0.1s;

    &:active {
      background: $orange;
      transform: scale(0.96);
    }
  }

  // ── Récap inter-manches ────────────────────────────────────────────────
  &__recap {
    position: fixed;
    inset: 0;
    background: $bg;
    z-index: 90;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $padding-xl $padding-md;
  }

  &__recap-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-lg;
    width: 100%;
    max-width: 380px;
  }

  &__recap-emoji  { font-size: 56px; line-height: 1; }

  &__recap-title  {
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

  &__recap-stat-value {
    font-family: $font-title;
    font-weight: 700;
    font-size: 36px;
    color: $white;
    line-height: 1;
  }

  &__recap-stat-label {
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

  // ── Game over ──────────────────────────────────────────────────────────
  &__gameover {
    position: fixed;
    inset: 0;
    background: $bg;
    z-index: 90;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: $padding-md $padding-md calc($padding-xxl + 16px);
    max-width: 420px;
    margin: 0 auto;
  }
}

// ── Transitions ─────────────────────────────────────────────────────────────
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from   { transform: translateY(40px); opacity: 0; }
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
