<script setup>
import { ref, shallowRef, computed, watch } from 'vue'
import AppIcon from '../AppIcon.vue'
import GameEntryBar from '../game/GameEntryBar.vue'
import SectorPad from '../game/SectorPad.vue'
import SvgDartboard from '../x01/SvgDartboard.vue'
import CheckoutRouteCard from './CheckoutRouteCard.vue'
import CheckoutBoardRoute from './CheckoutBoardRoute.vue'
import { bracketOf } from '../../composables/useCheckouts.js'

const INPUT_KEY = 'checkout-quiz-input'
const inputMode = ref(
  (() => {
    try {
      return localStorage.getItem(INPUT_KEY) === 'dart' ? 'dart' : 'board'
    } catch {
      return 'board'
    }
  })(),
)
function setInputMode(m) {
  inputMode.value = m
  try {
    localStorage.setItem(INPUT_KEY, m)
  } catch {
    /* storage unavailable */
  }
}

const props = defineProps({
  score: { type: Number, default: null },
  checkout: { type: Object, default: null },
  attemptDarts: { type: Array, required: true },
  answered: { type: Boolean, default: false },
  lastResult: { type: Object, default: null }, // { score, darts, correct, optimal, points }
  progress: { type: Object, required: true },
  points: { type: Number, default: 0 },
})

const emit = defineEmits(['dart', 'undo', 'submit', 'next'])

const finite = computed(() => Number.isFinite(props.progress.total))
const fillPct = computed(() => (finite.value ? Math.round((props.progress.index / props.progress.total) * 100) : 0))
const isLast = computed(() => finite.value && props.progress.index + 1 >= props.progress.total)

const bracketTag = computed(() => {
  const b = bracketOf(props.score)
  return b ? `${b.label} · ${b.points} pt${b.points > 1 ? 's' : ''}` : null
})

const result = computed(() => {
  const r = props.lastResult
  if (!props.answered || !r) return null
  const pts = r.points ? `+${r.points} pts` : '0 pt'
  if (r.optimal) return { tone: 'green', icon: 'check', title: 'Checkout !', pts }
  if (r.correct) return { tone: 'orange', icon: 'check', title: 'Checkout valide', pts }
  const left = r.score - r.darts.reduce((s, d) => s + d.pts, 0)
  return { tone: 'red', icon: 'close', title: left > 0 ? `Raté · reste ${left}` : 'Raté', pts }
})

// Route shown on the board once answered: the one played when valid, else the
// recommended one. Picking another row keeps studying the other finishes.
const playedRoute = computed(() => (props.lastResult?.correct ? props.lastResult.darts : null))
const studyRoute = shallowRef(null)
watch(
  () => props.answered,
  (a) => {
    if (a) studyRoute.value = playedRoute.value ?? props.checkout?.primary ?? null
  },
)
</script>

<template>
  <div class="quiz">
    <div class="quiz__progress">
      <span class="quiz__label">Progression</span>
      <span v-if="finite" class="quiz__bar"><span class="quiz__bar-fill" :style="{ width: fillPct + '%' }" /></span>
      <span class="quiz__counter">
        Question <b>{{ progress.index + 1 }}</b><template v-if="finite"> / {{ progress.total }}</template>
        · <b>{{ points }} pts</b>
      </span>
    </div>

    <div class="quiz__band" :class="result && `quiz__band--${result.tone}`">
      <span class="quiz__band-score">
        <span class="quiz__kicker">Reste à finir</span>
        <span class="quiz__score">{{ score }}</span>
      </span>
      <span class="quiz__band-side">
        <span v-if="result" class="quiz__result">
          <AppIcon :name="result.icon" :width="22" :height="22" />{{ result.title }}
        </span>
        <span class="quiz__tag">{{ result ? result.pts : bracketTag }}</span>
      </span>
    </div>

    <div class="quiz__entry">
      <span class="quiz__label">Ta sortie<template v-if="!answered"> · {{ inputMode === 'board' ? 'cible' : 'fléchette par fléchette' }}</template></span>
      <GameEntryBar
        class="quiz__entry-bar"
        :mode="inputMode"
        :modes="['board', 'dart']"
        :darts="attemptDarts"
        :locked="answered"
        @select="setInputMode"
        @erase="emit('undo')"
      />
    </div>

    <div class="quiz__stage">
      <CheckoutBoardRoute v-if="answered" :route="studyRoute || []" />
      <SectorPad
        v-else-if="inputMode === 'dart'"
        :locked="attemptDarts.length >= 3"
        :actions="false"
        @dart="emit('dart', $event)"
      />
      <SvgDartboard
        v-else
        :locked="attemptDarts.length >= 3"
        zoomable
        fill
        @dart="emit('dart', $event)"
      />
    </div>

    <div v-if="answered" class="quiz__info">
      <span class="quiz__label">Routes</span>
      <CheckoutRouteCard
        :checkout="checkout"
        selectable
        :selected="studyRoute"
        :played="playedRoute"
        @select="studyRoute = $event"
      />
    </div>
    <p v-else class="quiz__help">
      {{ inputMode === 'board' ? 'Clique sur la cible' : 'Choisis le secteur' }} pour chaque fléchette de ta sortie.
      La réponse est validée dès que la sortie est complète.
    </p>

    <button v-if="answered" class="quiz__btn quiz__btn--next" @click="emit('next')">
      {{ isLast ? 'Voir le récap' : 'Question suivante' }}
      <AppIcon name="arrow-right" :width="22" :height="22" />
    </button>
    <button v-else class="quiz__btn quiz__btn--submit" :disabled="!attemptDarts.length" @click="emit('submit')">
      <AppIcon name="check" :width="22" :height="22" />
      Valider
    </button>
  </div>
</template>

<style lang="scss" scoped>
.quiz {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__progress {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__label {
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
    margin-left: auto;
    @include text-sm;
    color: $muted;
    font-variant-numeric: tabular-nums;

    b { color: $text-color; font-weight: 600; }
  }

  &__band {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-sm;
    background: $mode-checkout;
    color: $white;
    transition: background 0.2s;

    &--green  { background: $accent; }
    &--orange { background: $orange; }
    &--red    { background: $error; }
  }

  &__band-score {
    display: flex;
    flex-direction: column;
  }

  &__kicker {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    opacity: 0.8;
  }

  &__score {
    @include display-xs;
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
  }

  &__band-side {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $gap-xxs;
  }

  &__result {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    @include title-xl;
  }

  &__tag {
    padding: 2px $padding-xs;
    border-radius: $radius-sm;
    background: rgba($white, 0.2);
    @include title-sm;
  }

  &__entry {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__entry-bar { --entry-color: #{$mode-checkout}; }

  &__stage {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    container-type: size;

    > .sector-pad { width: 100%; }
  }

  &__info {
    flex-shrink: 0;
    max-height: 30%;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    overflow-y: auto;
  }

  &__help { display: none; }

  &__btn {
    height: 56px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    border-radius: $radius-sm;
    color: $white;
    @include title-xl;
    transition: opacity 0.15s;

    &:active:not(:disabled) { opacity: 0.8; }
    &:disabled { opacity: 0.4; }

    &--submit { background: $mode-checkout; }
    &--next   { background: $black; }
  }
}

@media (min-width: $bp-laptop) {
  // Band and board on the left; progress, entry, routes and action on the right
  .quiz {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 440px;
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    grid-template-areas:
      'band  progress'
      'stage entry'
      'stage info'
      'stage action';
    gap: $gap-xl $gap-xxl + $gap-xs;

    &__band     { grid-area: band; gap: $gap-md; padding: $padding-md $padding-xl; }
    &__progress { grid-area: progress; flex-direction: column; align-items: stretch; gap: $gap-xs; }
    &__entry    { grid-area: entry; }
    &__stage    { grid-area: stage; }
    &__info,
    &__help     { grid-area: info; align-self: start; }
    &__btn      { grid-area: action; height: 64px; @include title-xxl; }

    &__label    { display: block; }
    &__bar      { flex: none; height: 10px; }
    &__counter  { margin-left: 0; @include text-md; }
    &__kicker   { @include text-sm; }
    &__score    { @include display-md; }
    &__result   { @include title-xxl; }
    &__tag      { padding: $padding-xxs $padding-xs; @include title-lg; }
    &__info     { max-height: none; min-height: 0; }

    &__help {
      display: block;
      @include text-md;
      line-height: 1.45;
      color: $muted;
    }
  }
}
</style>
