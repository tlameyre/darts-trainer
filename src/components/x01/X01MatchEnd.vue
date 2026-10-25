<script setup>
import { ref, computed, watch } from 'vue'
import { checkoutPct } from '../../composables/useX01MatchStats.js'
import AppIcon from '../AppIcon.vue'
import AppTabs from '../AppTabs.vue'
import X01StatBars from './X01StatBars.vue'
import X01VisitsChart from './X01VisitsChart.vue'
import X01CheckoutReview from './X01CheckoutReview.vue'

const props = defineProps({
  matchStats:       { type: Object, default: null }, // buildMatchStats() output
  winnerIndex:      { type: Number, default: null }, // null: stopped before anyone won
  subtitle:         { type: String, default: '' },
  replayLabel:      { type: String, default: 'Rejouer' },
  checkoutAnalysis: { type: Object, default: null }, // analyzeLegs() output
  // Read-only view of a saved match: no quit / replay buttons (leg detail keeps its way back)
  hideActions:      { type: Boolean, default: false },
})

const emit = defineEmits(['replay', 'home', 'leg-detail'])

// null = whole match, else the leg number shown in detail
const selectedLeg = ref(null)
const rootEl = ref(null)
watch(selectedLeg, () => rootEl.value?.scrollTo({ top: 0 }))
const leg = computed(() => props.matchStats?.legs.find(l => l.number === selectedLeg.value) ?? null)
// Lets a host screen drop its own header while the leg detail has one
watch(leg, (l) => emit('leg-detail', !!l))

const players = computed(() => props.matchStats?.players ?? [])
const nameOf  = (i) => players.value[i]?.name ?? ''

const fmtAvg = v => (v == null ? '–' : v.toFixed(1).replace('.', ','))
const fmtPct = v => (v == null ? '–' : `${Math.round(v)} %`)
const orDash = v => v ?? '–'

const ROW_DEFS = {
  average:  { label: 'Moyenne',          better: 'high', value: s => s.average,        format: fmtAvg },
  first9:   { label: 'Moy. 9 premières', better: 'high', value: s => s.first9Average,  format: fmtAvg },
  scoring:  { label: 'Marquage',         better: 'high', value: s => s.scoringAverage, format: fmtAvg },
  checkout: { label: 'Checkout',         better: 'high', value: checkoutPct,           format: fmtPct },
  doubles:  {
    label: 'Doubles réussis', better: 'high', value: checkoutPct,
    text: s => (s.checkoutAttempts == null ? '–' : `${s.checkoutHits} / ${s.checkoutAttempts}`),
  },
  finish:   { label: 'Meilleur finish',  better: 'high', value: s => s.highestFinish,  format: orDash },
  bestLeg:  { label: 'Meilleure manche', better: 'low',  value: s => s.bestLeg,        format: v => (v == null ? '–' : `${v} fl.`) },
  darts:    { label: 'Fléchettes',       better: null,   value: s => s.darts,          format: orDash },
}

const MATCH_ROWS = ['average', 'first9', 'scoring', 'checkout', 'doubles', 'finish', 'bestLeg']
const LEG_ROWS   = ['average', 'scoring', 'first9', 'checkout', 'doubles', 'finish', 'darts']

const shownStats = computed(() => (leg.value ? leg.value.players : props.matchStats?.match) ?? [])

const statRows = computed(() => (leg.value ? LEG_ROWS : MATCH_ROWS).map((key) => {
  const def = ROW_DEFS[key]
  return {
    label:  key === 'finish' && leg.value ? 'Finish' : def.label,
    better: def.better,
    cells:  shownStats.value.map((s) => {
      const value = def.value(s)
      return { value, text: def.text ? def.text(s) : def.format(value) }
    }),
  }
}))

// Leg selector: winner, darts and finish of each leg
const legRows = computed(() => (props.matchStats?.legs ?? []).map((l) => {
  const w = l.players[l.winnerIndex]
  return {
    number:  l.number,
    winner:  l.winnerIndex,
    name:    w ? nameOf(l.winnerIndex) : 'Non terminée',
    detail:  w ? `en ${w.darts} fl. · finish ${w.highestFinish ?? '–'}` : '',
    average: w ? fmtAvg(w.average) : '',
  }
}))

const legTabs = computed(() => legRows.value.map(l => ({ id: String(l.number), label: `Manche ${l.number}` })))

const selectedLegId = computed({
  get: () => String(selectedLeg.value),
  set: (id) => { selectedLeg.value = Number(id) },
})

const legWinnerStats =computed(() => leg.value?.players[leg.value.winnerIndex] ?? null)
</script>

<template>
  <div ref="rootEl" class="match-end">
    <!-- ── Green hero: winner of the match, or of the leg in detail ──────────── -->
    <section class="match-end__hero">
      <header v-if="!hideActions || leg" class="match-end__bar">
        <button
          v-if="leg"
          class="match-end__icon-btn"
          aria-label="Retour au match"
          @click="selectedLeg = null"
        ><AppIcon name="arrow-left" :width="24" :height="24" /></button>
        <button v-else class="match-end__icon-btn" aria-label="Quitter" @click="$emit('home')">
          <AppIcon name="exit" :width="24" :height="24" />
        </button>
        <h1 class="match-end__heading">{{ leg ? `Manche ${leg.number} · détail` : 'Fin de partie' }}</h1>
        <span />
      </header>

      <div class="match-end__winner">
        <span class="match-end__trophy"><AppIcon name="trophy" :width="32" :height="32" /></span>
        <div class="match-end__winner-text">
          <span class="match-end__kicker">
            <template v-if="leg">{{ leg.winnerIndex >= 0 ? 'Manche gagnée par' : 'Manche' }}</template>
            <template v-else>{{ winnerIndex != null ? 'Victoire' : 'Partie terminée' }}</template>
          </span>
          <span class="match-end__name">
            <template v-if="leg">{{ leg.winnerIndex >= 0 ? nameOf(leg.winnerIndex) : 'Non terminée' }}</template>
            <template v-else>{{ winnerIndex != null ? nameOf(winnerIndex) : '' }}</template>
          </span>
        </div>
        <slot v-if="!leg" name="winner-aside" />
      </div>

      <template v-if="leg">
        <div v-if="legWinnerStats" class="match-end__figures">
          <div class="match-end__figure">
            <span class="match-end__figure-val">{{ legWinnerStats.darts }}</span>
            <span class="match-end__kicker">Fléchettes</span>
          </div>
          <div class="match-end__figure">
            <span class="match-end__figure-val">{{ legWinnerStats.highestFinish ?? '–' }}</span>
            <span class="match-end__kicker">Finish</span>
          </div>
          <div class="match-end__figure">
            <span class="match-end__figure-val">{{ fmtAvg(legWinnerStats.average) }}</span>
            <span class="match-end__kicker">Moyenne</span>
          </div>
        </div>
      </template>

      <template v-else-if="matchStats">
        <div class="match-end__standings" :style="{ '--count': players.length }">
          <div v-for="(p, i) in players" :key="i" class="match-end__standing">
            <span class="match-end__standing-name">{{ p.name }}</span>
            <span class="match-end__standing-legs">{{ matchStats.match[i].legsWon }}</span>
          </div>
        </div>
        <p v-if="subtitle" class="match-end__subtitle">{{ subtitle }}</p>
      </template>
    </section>

    <!-- ── Stats ──────────────────────────────────────────────────────────────── -->
    <main v-if="matchStats" class="match-end__main" :class="{ 'match-end__main--leg': leg }">
      <AppTabs
        v-if="leg"
        v-model="selectedLegId"
        class="match-end__tabs"
        variant="leg"
        scrollable
        :tabs="legTabs"
      />

      <div v-if="!leg" class="match-end__legs">
        <div class="match-end__section-head">
          <h3 class="match-end__section-title">Manche par manche</h3>
          <span class="match-end__section-hint">touche pour le détail</span>
        </div>
        <button
          v-for="l in legRows"
          :key="l.number"
          class="match-end__leg"
          @click="selectedLeg = l.number"
        >
          <span class="match-end__leg-badge" :class="l.winner >= 0 && `match-end__leg-badge--p${l.winner}`">M{{ l.number }}</span>
          <span class="match-end__leg-id">
            <span class="match-end__leg-name">{{ l.name }}</span>
            <span v-if="l.detail" class="match-end__leg-detail">{{ l.detail }}</span>
          </span>
          <span v-if="l.average" class="match-end__leg-avg">
            <span class="match-end__leg-avg-val" :class="`match-end__leg-avg-val--p${l.winner}`">{{ l.average }}</span>
            <span class="match-end__leg-detail">moyenne</span>
          </span>
          <AppIcon class="match-end__leg-chevron" name="angle-down" :width="18" :height="18" />
        </button>
      </div>

      <X01StatBars
        class="match-end__stats"
        :title="leg ? 'Stats de la manche' : 'Stats générales'"
        :players="players"
        :rows="statRows"
      />

      <X01VisitsChart class="match-end__visits" :players="players" :stats="shownStats" />

      <section v-if="checkoutAnalysis && !leg" class="match-end__review">
        <div class="match-end__section-head">
          <h3 class="match-end__section-title">Analyse des checkouts</h3>
        </div>
        <X01CheckoutReview :analysis="checkoutAnalysis" />
      </section>
    </main>

    <p v-else class="match-end__empty">Aucune volée enregistrée cette partie.</p>

    <div v-if="!hideActions || leg" class="match-end__actions">
      <button v-if="leg" class="match-end__btn" @click="selectedLeg = null">Retour au match</button>
      <template v-else>
        <button class="match-end__btn" @click="$emit('home')">Retour</button>
        <button class="match-end__btn match-end__btn--primary" @click="$emit('replay')">{{ replayLabel }}</button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.match-end {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background: $bg;
  color: $text-color;

  // ── Hero ──────────────────────────────────────────────────────────────────
  &__hero {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-md;
    background: var(--game-color, #{$accent});
    color: $white;
  }

  // Same metrics as AppHeader (48px side columns, bare 24px icon) so a leg detail lines up with the match view
  &__bar {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 48px;
    align-items: center;
    margin-bottom: $padding-md;
  }

  &__icon-btn {
    display: flex;
    justify-self: start;
    padding: 0;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__heading {
    @include title-lg;
    text-align: center;
  }

  &__winner {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__trophy {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $white;
    color: var(--game-color, #{$accent});
  }

  &__winner-text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__kicker {
    @include text-xs;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: $tracking-lg;
    opacity: 0.8;
  }

  &__name {
    @include title-xxxl;
    line-height: 0.9;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__standings,
  &__figures {
    display: grid;
    grid-template-columns: repeat(var(--count, 3), minmax(0, 1fr));
    gap: $gap-sm;
    padding-top: $padding-sm;
    border-top: $border-md solid rgba($white, 0.3);
  }

  &__standing {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    & + & {
      padding-left: $padding-sm;
      border-left: $border-md solid rgba($white, 0.3);
      opacity: 0.85;
    }
  }

  &__standing-name {
    @include title-sm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__standing-legs {
    @include title-xxxl;
    line-height: 1;
  }

  &__subtitle {
    @include text-sm;
    opacity: 0.8;
  }

  &__figure {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__figure-val {
    @include title-xxxl;
    line-height: 1;
  }

  &__tabs {
    margin: (-$padding-md) (-$padding-md) 0;
    border-radius: 0;
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-md;
  }

  &__legs,
  &__review {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__section-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: $padding-xs 0;
    border-bottom: $border-lg solid $text-color;
  }

  &__section-title { @include title-lg; }

  &__section-hint {
    @include text-xs;
    color: $muted;
  }

  &__leg {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto 18px;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;
    text-align: left;
  }

  &__leg-badge {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $border-color;
    color: $white;
    @include title-xl;
  }

  &__leg-badge,
  &__leg-avg-val {
    @each $i, $color in $player-colors {
      &--p#{$i} { --player: #{$color}; }
    }
  }

  &__leg-badge[class*='--p'] { background: var(--player); }
  &__leg-avg-val { color: var(--player, $text-color); }

  &__leg-id,
  &__leg-avg {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__leg-avg { align-items: flex-end; }

  &__leg-name,
  &__leg-avg-val {
    @include title-md;
    line-height: 1;
  }

  &__leg-detail {
    @include text-xs;
    color: $muted;
  }

  &__leg-chevron {
    color: $muted;
    transform: rotate(-90deg);
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl $padding-md;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  &__actions {
    position: sticky;
    bottom: 0;
    margin-top: auto;
    display: flex;
    gap: $gap-xs;
    padding: $padding-sm $padding-md;
    @include safe-bottom($padding-md);
    background: $bg;
  }

  &__btn {
    flex: 1;
    height: 56px;
    border-radius: $radius-sm;
    border: $border-md solid $text-color;
    color: $text-color;
    @include title-lg;
    transition: opacity 0.15s;

    &:active { opacity: 0.75; }

    &--primary {
      background: var(--game-color, #{$accent});
      border-color: var(--game-color, #{$accent});
      color: $white;
    }
  }
}

@media (min-width: $bp-laptop) {
  // Hero and actions form the green column on the left, stats scroll on the right
  .match-end {
    display: grid;
    grid-template-columns: 440px minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    overflow: hidden;

    &__bar { margin-bottom: 0; }

    &__hero {
      grid-column: 1;
      grid-row: 1;
      gap: $gap-xl;
      padding: $padding-xxl $padding-xxl 0;
    }

    &__actions {
      grid-column: 1;
      grid-row: 2;
      position: static;
      gap: $gap-sm;
      padding: $padding-xl $padding-xxl;
      @include safe-bottom($padding-xxl);
      background: var(--game-color, #{$accent});
    }

    &__btn {
      height: 60px;
      border-color: $white;
      color: $white;
      @include title-xl;

      &--primary {
        background: $white;
        color: var(--game-color, #{$accent});
      }
    }

    &__main,
    &__empty {
      grid-column: 2;
      grid-row: 1 / 3;
      overflow-y: auto;
    }

    &__main {
      display: grid;
      grid-template-columns: 380px minmax(0, 1fr);
      grid-template-areas:
        'legs   stats'
        'visits stats'
        'review review';
      align-content: start;
      gap: $gap-xl $gap-xxl;
      padding: $padding-xxl;

      &--leg {
        grid-template-columns: minmax(0, 1fr) 380px;
        grid-template-areas:
          'tabs  tabs'
          'stats visits';
      }
    }

    &__tabs {
      grid-area: tabs;
      margin: (-$padding-xxl) (-$padding-xxl) (-$padding-md);
    }

    &__legs   { grid-area: legs; }
    &__stats  { grid-area: stats; }
    &__visits { grid-area: visits; }
    &__review { grid-area: review; }

    &__heading      { @include title-xl; }
    &__trophy       { width: 72px; height: 72px; }
    &__kicker       { @include text-sm; }
    &__name         { @include display-xs; }
    &__standing-name { @include title-md; }
    &__standing-legs,
    &__figure-val   { @include display-xs; }
    &__subtitle     { @include text-md; }
    &__section-title { @include title-xxl; }
    &__section-hint { @include text-sm; }
    &__leg-name,
    &__leg-avg-val  { @include title-lg; }
    &__leg-detail   { @include text-sm; }
  }
}
</style>
