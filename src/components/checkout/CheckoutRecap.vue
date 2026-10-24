<script setup>
import { computed } from 'vue'
import AppIcon from '../AppIcon.vue'
import DartPill from './DartPill.vue'
import { getCheckout } from '../../composables/useCheckouts.js'

const props = defineProps({
  variant: { type: String, required: true }, // 'quiz' | 'review'
  sessionStats: { type: Object, default: null }, // quiz
  results: { type: Array, default: () => [] }, // quiz, per question — absent for saved sessions
  reviewedCount: { type: Number, default: 0 }, // review
  reviewTotal: { type: Number, default: 0 }, // review
  // Embedded read-only view (session history): no header nor actions
  hideActions: { type: Boolean, default: false },
})

const emit = defineEmits(['exit', 'restart', 'home'])

const isQuiz = computed(() => props.variant === 'quiz')

const successRate = computed(() => {
  const s = props.sessionStats
  return s && s.questions ? Math.round((s.correct / s.questions) * 100) : 0
})

const STATUS = {
  optimal: { icon: 'check', label: 'Recommandée' },
  valid:   { icon: 'check', label: 'Autre route' },
  missed:  { icon: 'close', label: 'Ratée' },
}

// A non-recommended answer also shows the recommended route to learn
const rows = computed(() => props.results.map((r, i) => {
  const status = r.optimal ? 'optimal' : r.correct ? 'valid' : 'missed'
  return {
    key: i,
    number: i + 1,
    score: r.score,
    darts: r.darts,
    status,
    ...STATUS[status],
    primary: status === 'optimal' ? null : getCheckout(r.score)?.primary ?? null,
    points: r.points,
  }
}))
</script>

<template>
  <div class="co-recap" :class="{ 'co-recap--embedded': hideActions }">
    <aside class="co-recap__hero">
      <header v-if="!hideActions" class="co-recap__header">
        <button class="co-recap__exit" aria-label="Quitter" @click="emit('exit')">
          <AppIcon name="exit" :width="24" :height="24" />
        </button>
        <h1 class="co-recap__title">{{ isQuiz ? 'Fin du quiz' : 'Révision terminée' }}</h1>
      </header>

      <template v-if="isQuiz && sessionStats">
        <div class="co-recap__main-stat">
          <span class="co-recap__rate">
            <span class="co-recap__rate-label">Sorties réussies</span>
            <span class="co-recap__rate-value">{{ successRate }}<span class="co-recap__rate-unit">%</span></span>
          </span>
          <span class="co-recap__points">
            <span class="co-recap__points-value">{{ sessionStats.points }}</span>
            <span class="co-recap__points-label">points</span>
          </span>
        </div>

        <div class="co-recap__stats">
          <span class="co-recap__stat">
            <span class="co-recap__stat-value">{{ sessionStats.correct }}/{{ sessionStats.questions }}</span>
            <span class="co-recap__stat-label">Sorties trouvées</span>
          </span>
          <span class="co-recap__stat">
            <span class="co-recap__stat-value">{{ sessionStats.optimal }}</span>
            <span class="co-recap__stat-label">Routes recommandées</span>
          </span>
          <span class="co-recap__stat">
            <span class="co-recap__stat-value">{{ sessionStats.bestStreak }}</span>
            <span class="co-recap__stat-label">Meilleure série</span>
          </span>
        </div>
      </template>

      <div v-else class="co-recap__main-stat">
        <span class="co-recap__rate">
          <span class="co-recap__rate-label">Checkouts acquis</span>
          <span class="co-recap__rate-value">
            {{ reviewedCount }}<span v-if="reviewTotal" class="co-recap__rate-unit">/{{ reviewTotal }}</span>
          </span>
        </span>
      </div>
    </aside>

    <main v-if="rows.length || !hideActions" class="co-recap__body">
      <section v-if="rows.length" class="co-recap__list">
        <div class="co-recap__list-head">
          <span class="co-recap__list-title">Récap par question</span>
          <span class="co-recap__list-count">{{ rows.length }} question{{ rows.length > 1 ? 's' : '' }}</span>
        </div>

        <div class="co-recap__legend">
          <span class="co-recap__legend-key"><span class="co-recap__swatch co-recap__swatch--optimal" />Recommandée ×2</span>
          <span class="co-recap__legend-key"><span class="co-recap__swatch co-recap__swatch--valid" />Autre route</span>
          <span class="co-recap__legend-key"><span class="co-recap__swatch co-recap__swatch--missed" />Ratée</span>
        </div>

        <div class="co-recap__rows">
          <div v-for="row in rows" :key="row.key" class="co-recap__row" :class="`co-recap__row--${row.status}`">
            <span class="co-recap__icon">
              <AppIcon :name="row.icon" :width="18" :height="18" />
            </span>
            <span class="co-recap__row-body">
              <span class="co-recap__row-head">
                <span class="co-recap__row-number">Q{{ row.number }}</span>
                <span class="co-recap__row-score">{{ row.score }}</span>
                <span class="co-recap__row-status">{{ row.label }}</span>
              </span>
              <span class="co-recap__row-darts">
                <DartPill
                  v-for="(d, j) in row.darts"
                  :key="j"
                  :dart="d"
                  size="sm"
                  :tone="row.status === 'missed' ? 'light' : 'neutral'"
                />
                <span v-if="row.primary" class="co-recap__row-primary">
                  →
                  <DartPill
                    v-for="(d, j) in row.primary"
                    :key="j"
                    :dart="d"
                    size="sm"
                    :tone="row.status === 'missed' ? 'green' : 'orange'"
                  />
                </span>
              </span>
            </span>
            <span class="co-recap__row-points">{{ row.points ? `+${row.points}` : 0 }}</span>
          </div>
        </div>
      </section>

      <div v-if="!hideActions" class="co-recap__actions">
        <button class="co-recap__btn co-recap__btn--primary" @click="emit('restart')">Rejouer</button>
        <button class="co-recap__btn" @click="emit('home')">Accueil</button>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.co-recap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  &__hero {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-md;
    background: $mode-checkout;
    color: $white;
  }

  &--embedded &__hero { border-radius: $radius-sm; }

  &__header {
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 48px;
    align-items: center;
    padding-top: $padding-xs;
  }

  &__exit {
    display: flex;
    padding: $padding-xxs;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__title {
    @include title-lg;
    letter-spacing: $tracking-sm;
    text-align: center;
  }

  &__main-stat {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $gap-md;
  }

  &__rate {
    display: flex;
    flex-direction: column;
  }

  &__rate-label { @include title-lg; }

  &__rate-value {
    @include display-lg;
    line-height: 0.9;
    font-variant-numeric: tabular-nums;
  }

  &__rate-unit { @include display-xs; }

  &__points {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: $white;
    color: $mode-checkout;
  }

  &__points-value {
    @include title-xxxl;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__points-label,
  &__stat-label {
    @include text-xs;
  }

  &__points-label {
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $gap-sm;
    padding-top: $padding-sm;
    border-top: $border-md solid rgba($white, 0.3);
  }

  &__stat {
    display: flex;
    flex-direction: column;
  }

  &__stat-value {
    @include title-xxl;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  &__stat-label { opacity: 0.8; }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
    padding: $padding-md $padding-md 0;
    @include safe-bottom($padding-xl);
  }

  &--embedded &__body { padding: $padding-md 0 0; }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__list-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: $padding-xs;
    border-bottom: $border-lg solid $text-color;
  }

  &__list-title { @include title-lg; }

  &__list-count {
    @include text-sm;
    color: $muted;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-sm;
    @include text-xs;
    font-weight: 600;
    color: $muted;
  }

  &__legend-key {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
  }

  &__swatch {
    width: 10px;
    height: 10px;
    border-radius: $radius-xs;
  }

  &__swatch--optimal,
  &__row--optimal &__icon { background: $accent; }

  &__swatch--valid,
  &__row--valid &__icon { background: $orange; }

  &__swatch--missed,
  &__row--missed &__icon { background: $error; }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__icon {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    color: $white;
  }

  &__row-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__row-head {
    display: flex;
    align-items: baseline;
    gap: $gap-xs;
  }

  &__row-number {
    @include title-sm;
    color: $muted;
  }

  &__row-score {
    @include title-xl;
    line-height: 1;
  }

  &__row-status {
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
  }

  &__row--optimal &__row-status,
  &__row--optimal &__row-points { color: $accent; }

  &__row--valid &__row-status,
  &__row--valid &__row-points { color: $orange; }

  &__row--missed &__row-status { color: $error; }
  &__row--missed &__row-points { color: $muted; }

  &__row-darts,
  &__row-primary {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $gap-xxs;
  }

  &__row-primary {
    @include text-xs;
    color: $muted;
  }

  &__row-points {
    @include title-xl;
    font-variant-numeric: tabular-nums;
  }

  &__actions {
    position: sticky;
    bottom: 0;
    margin-top: auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
    padding-top: $padding-xs;
    background: $bg;
  }

  &__btn {
    height: 56px;
    border: $border-md solid $text-color;
    border-radius: $radius-sm;
    color: $text-color;
    @include title-lg;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }

    &--primary {
      border-color: $mode-checkout;
      background: $mode-checkout;
      color: $white;
    }
  }
}

@media (min-width: $bp-laptop) {
  // Colored summary on the left, per-question list and actions on the right
  .co-recap {
    display: grid;
    grid-template-columns: 440px minmax(0, 1fr);
    overflow: hidden;

    &--embedded {
      display: flex;
      overflow: visible;
    }

    &__hero {
      gap: $gap-xl + $gap-xxs;
      padding: $padding-xxl;
    }

    &__header {
      display: flex;
      gap: $gap-sm;
      padding: 0;
    }

    &__title      { @include title-xxl; }
    &__rate-label { @include title-xxl; }
    &__rate-value { @include display-xl; }
    &__rate-unit  { @include display-sm; }

    &__points       { padding: $padding-xs $padding-md; }
    &__points-value { @include display-xs; }
    &__points-label { @include text-sm; }

    &__stats      { gap: $gap-md; padding-top: $padding-lg; }
    &__stat-value { @include title-xxxl; }
    &__stat-label { @include text-sm; }

    &__body {
      min-height: 0;
      overflow-y: auto;
      padding: $padding-xxl;
    }

    &__list-title { @include title-xxl; }
    &__list-count { @include text-md; }
    &__legend     { gap: $gap-md; @include text-sm; }

    &__rows {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $gap-xs $gap-sm;
    }

    &__row-number { @include title-md; }
    &__row-score  { @include title-xxl; }
    &__row-status { @include text-xs; }
    &__row-points { @include title-xxl; }

    &__actions { gap: $gap-sm; }
    &__btn     { height: 64px; @include title-xl; }
  }
}
</style>
