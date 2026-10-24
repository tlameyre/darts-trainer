<script setup>
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '../AppIcon.vue'
import CheckoutRouteCard from './CheckoutRouteCard.vue'
import CheckoutBoardRoute from './CheckoutBoardRoute.vue'
import { bracketOf } from '../../composables/useCheckouts.js'
import { useMediaQuery } from '../../composables/useMediaQuery.js'

const props = defineProps({
  score: { type: Number, default: null },
  checkout: { type: Object, default: null },
  revealed: { type: Boolean, default: false },
  done: { type: Number, default: 0 },
  total: { type: Number, default: 1 },
})

const emit = defineEmits(['toggle', 'grade']) // grade payload: true = acquis, false = à revoir

const fillPct = computed(() => Math.round((props.done / props.total) * 100))

const bracketTag = computed(() => {
  const b = bracketOf(props.score)
  return b ? `${b.label} · ${b.points} pt${b.points > 1 ? 's' : ''}` : null
})

// Same value as $bp-laptop: the route list moves from the card to the side column
const isLaptop = useMediaQuery('(min-width: 1025px)')

// Route affichée sur la cible — remise sur la recommandée à chaque carte.
const selectedRoute = shallowRef(null)
watch(
  () => props.score,
  () => { selectedRoute.value = props.checkout?.primary ?? null },
  { immediate: true },
)

// ─── Geste swipe / tap (Pointer Events : souris + tactile) ───────────
const cardEl = ref(null)
const dragX = ref(0)
const dragging = ref(false)
const flying = ref(false)
const animating = ref(false)

let startX = 0
let startY = 0
let dirLocked = null // 'h' | 'v' | null
let capturedId = null

const SWIPE = 60
const FLY_MS = 200 // doit rester égal à la durée de transition transform/opacity de .deck__card

function capture(id) {
  try { cardEl.value?.setPointerCapture(id) } catch { /* pointeur déjà relâché */ }
}
function release(id) {
  try { cardEl.value?.releasePointerCapture(id) } catch { /* rien à relâcher */ }
}

const cardStyle = computed(() => ({
  transform: `translateX(${dragX.value}px) rotate(${dragX.value * 0.02}deg)`,
  opacity: String(Math.max(0, Math.min(1, 1 - Math.abs(dragX.value) / 500))),
  transition: !dragging.value && flying.value ? `transform ${FLY_MS}ms ease, opacity ${FLY_MS}ms ease` : 'none',
}))

function onDown(e) {
  if (animating.value) return
  startX = e.clientX
  startY = e.clientY
  dirLocked = null
  dragging.value = true
  capturedId = e.pointerId
  // pas de setPointerCapture ici : sinon les clics sur les lignes de route
  // (boutons) ne remontent plus. On capture seulement si un drag horizontal démarre.
}

function onMove(e) {
  if (!dragging.value) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!dirLocked) {
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
    dirLocked = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h'
    if (dirLocked === 'v') {
      dragging.value = false // laisse le scroll vertical
      return
    }
    capture(e.pointerId) // drag horizontal confirmé : on prend le pointeur
  }
  // avant révélation, le swipe horizontal ne sert à rien : on n'entraîne pas la carte
  if (props.revealed) dragX.value = dx
}

function onUp() {
  if (!dragging.value) {
    dirLocked = null
    return
  }
  dragging.value = false
  release(capturedId)
  const dx = dragX.value

  const isTap = dirLocked !== 'h' || Math.abs(dx) < 8
  if (isTap) {
    dragX.value = 0
    // recto : tap = révéler. verso : le retour passe par le bouton dédié.
    if (!props.revealed) emit('toggle')
    return
  }
  if (props.revealed && dx >= SWIPE) return grade(true)
  if (props.revealed && dx <= -SWIPE) return grade(false)
  snapBack()
}

function snapBack() {
  flying.value = true
  dragX.value = 0
  setTimeout(() => { flying.value = false }, FLY_MS)
}

function grade(known) {
  if (animating.value) return
  animating.value = true
  flying.value = true
  dragX.value = (known ? 1 : -1) * 520
  setTimeout(() => {
    emit('grade', known) // le parent remonte la carte suivante : props (score/checkout/revealed) changent ici
    flying.value = false
    dragX.value = 0
    // `animating` reste vrai un instant de plus pour couper le crossfade recto/verso
    // (sinon le verso, déjà sur la nouvelle sortie, reste visible le temps de son fondu).
    setTimeout(() => { animating.value = false }, 50)
  }, FLY_MS)
}

// Desktop shortcuts: Space reveals, ← / → grade the revealed card
function onKey(e) {
  if (e.target.closest?.('input, textarea')) return
  if (e.code === 'Space') {
    e.preventDefault()
    if (!props.revealed) emit('toggle')
  } else if (props.revealed && e.key === 'ArrowLeft') {
    grade(false)
  } else if (props.revealed && e.key === 'ArrowRight') {
    grade(true)
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="deck">
    <div class="deck__progress">
      <span class="deck__side-label">Progression</span>
      <span class="deck__bar"><span class="deck__bar-fill" :style="{ width: fillPct + '%' }" /></span>
      <span class="deck__counter"><b>{{ done }}</b> / {{ total }} acquis</span>
    </div>

    <div
      ref="cardEl"
      class="deck__card"
      :style="cardStyle"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <div class="deck__face deck__face--front" :class="{ 'deck__face--hidden': revealed, 'deck__face--no-transition': animating }">
        <span v-if="bracketTag" class="deck__tag deck__tag--corner">{{ bracketTag }}</span>
        <span class="deck__kicker">Reste à finir</span>
        <span class="deck__score">{{ score }}</span>
        <span class="deck__hint">{{ isLaptop ? 'Clique' : 'Touche' }} la carte pour révéler les routes</span>
      </div>

      <div class="deck__face deck__face--back" :class="{ 'deck__face--hidden': !revealed, 'deck__face--no-transition': animating }">
        <div class="deck__band">
          <button type="button" class="deck__back" aria-label="Revenir au score" @click="emit('toggle')">
            <AppIcon name="arrow-left" :width="22" :height="22" />
          </button>
          <span class="deck__band-score">
            <span class="deck__kicker">Reste à finir</span>
            <span class="deck__value">{{ score }}</span>
          </span>
          <span v-if="bracketTag" class="deck__tag">{{ bracketTag }}</span>
        </div>
        <div class="deck__board">
          <CheckoutBoardRoute :route="selectedRoute || []" />
        </div>
        <CheckoutRouteCard
          v-if="!isLaptop"
          :checkout="checkout"
          selectable
          :selected="selectedRoute"
          class="deck__routes"
          @select="selectedRoute = $event"
        />
      </div>
    </div>

    <div class="deck__side">
      <template v-if="isLaptop">
        <div v-if="revealed" class="deck__side-block">
          <span class="deck__side-label">Routes · clique pour l'afficher sur la cible</span>
          <CheckoutRouteCard
            :checkout="checkout"
            selectable
            :selected="selectedRoute"
            @select="selectedRoute = $event"
          />
        </div>
        <template v-else>
          <p class="deck__help">
            Trouve la sortie de tête, puis révèle les routes pour vérifier.
            Marque ensuite la carte comme acquise ou à revoir.
          </p>
          <div class="deck__keys">
            <span class="deck__key-line"><kbd class="deck__key">Espace</kbd> révéler</span>
            <span class="deck__key-line">
              <kbd class="deck__key">←</kbd> à revoir · <kbd class="deck__key">→</kbd> acquis
            </span>
          </div>
        </template>
      </template>

      <div class="deck__actions">
        <template v-if="revealed">
          <div class="deck__grades">
            <button class="deck__btn deck__btn--again" @click="grade(false)">
              <AppIcon name="undo" :width="20" :height="20" /> À revoir
            </button>
            <button class="deck__btn deck__btn--good" @click="grade(true)">
              <AppIcon name="check" :width="20" :height="20" /> Acquis
            </button>
          </div>
          <span v-if="!isLaptop" class="deck__swipe-hint">ou glisse la carte : ← à revoir · acquis →</span>
        </template>
        <button v-else class="deck__btn deck__btn--reveal" @click="emit('toggle')">Révéler</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.deck {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__progress {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    flex-shrink: 0;
  }

  &__side-label {
    display: none;
    @include title-sm;
    color: $muted;
  }

  &__bar {
    flex: 1;
    height: 8px;
    display: flex;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__bar-fill {
    border-radius: $radius-sm;
    background: $mode-checkout;
    transition: width 0.25s ease;
  }

  &__counter {
    @include text-sm;
    color: $muted;
    font-variant-numeric: tabular-nums;

    b { color: $text-color; font-weight: 600; }
  }

  &__card {
    position: relative;
    flex: 1;
    min-height: 0;
    touch-action: pan-y;
    user-select: none;
    will-change: transform;
  }

  &__face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    border-radius: $radius-sm;
    overflow: hidden;
    transition: opacity 0.15s ease;

    &--hidden {
      opacity: 0;
      pointer-events: none;
    }

    &--no-transition { transition: none; }
  }

  &__face--front {
    align-items: center;
    justify-content: center;
    gap: $gap-sm;
    background: $mode-checkout;
    color: $white;
    cursor: pointer;
  }

  &__face--back {
    gap: $gap-sm;
    padding-bottom: $padding-sm;
    background: $surface;
  }

  &__tag {
    margin-left: auto;
    padding: 2px $padding-xs;
    border-radius: $radius-sm;
    background: rgba($white, 0.2);
    @include title-sm;

    &--corner {
      position: absolute;
      top: $padding-sm;
      left: $padding-sm;
      margin: 0;
    }
  }

  &__kicker {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.8;
  }

  &__score {
    @include display-xl;
    line-height: 0.85;
    font-variant-numeric: tabular-nums;
  }

  &__hint {
    margin-top: $gap-xs;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: rgba($white, 0.16);
    @include text-sm;
    font-weight: 600;
  }

  &__band {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm;
    background: $mode-checkout;
    color: $white;
  }

  &__back {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: rgba($white, 0.2);
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__band-score {
    display: flex;
    flex-direction: column;
  }

  &__value {
    @include title-xxxl;
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
  }

  &__board {
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;
    container-type: size;
  }

  // Long route lists scroll so the board keeps most of the card
  &__routes {
    flex-shrink: 0;
    max-height: 40%;
    padding: 0 $padding-sm;
    overflow-y: auto;
  }

  &__side { display: contents; }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    flex-shrink: 0;
  }

  &__grades {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__btn {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    border-radius: $radius-sm;
    @include title-lg;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }

    &--reveal {
      background: $black;
      color: $white;
      @include title-xl;
      letter-spacing: $tracking-sm;
    }

    &--again {
      border: $border-md solid $text-color;
      color: $text-color;
    }

    &--good {
      background: $mode-checkout;
      color: $white;
    }
  }

  &__swipe-hint {
    @include text-xs;
    color: $muted;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .deck {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 440px;
    grid-template-rows: auto minmax(0, 1fr);
    gap: $gap-xl $gap-xxl + $gap-xs;

    &__card { grid-row: 1 / span 2; grid-column: 1; }

    &__side {
      grid-row: 2;
      grid-column: 2;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: $gap-xl;
    }

    &__progress {
      grid-row: 1;
      grid-column: 2;
      flex-direction: column;
      align-items: stretch;
      gap: $gap-xs;
    }

    &__side-label { display: block; @include title-sm; }
    &__bar        { flex: none; height: 10px; }
    &__counter    { @include text-md; }

    &__tag              { padding: $padding-xxs $padding-xs; @include title-lg; }
    &__tag--corner      { top: $padding-lg; left: $padding-lg; }
    &__kicker           { @include text-sm; }
    &__score            { @include display-xxl; }
    &__hint             { padding: $padding-xs $padding-md; @include text-md; }
    &__band             { gap: $gap-md; padding: $padding-md $padding-lg; }
    &__back             { width: 48px; height: 48px; }
    &__value            { @include display-xs; }
    &__face--back       { padding-bottom: 0; }
    &__board            { padding: $padding-sm; }

    &__side-block {
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: $gap-xs;
      overflow-y: auto;
    }

    &__help {
      @include text-md;
      line-height: 1.45;
      color: $muted;
    }

    &__keys {
      display: flex;
      flex-direction: column;
      gap: $gap-xs;
      @include text-md;
      color: $muted;
    }

    &__key-line {
      display: flex;
      align-items: center;
      gap: $gap-xs;
    }

    &__key {
      min-width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 $padding-xxs;
      border: $border-md solid $border-color;
      border-radius: $radius-sm;
      background: $white;
      color: $text-color;
      @include title-sm;
    }

    &__actions { margin-top: auto; }
    &__btn     { height: 64px; @include title-xxl; }
  }
}
</style>
