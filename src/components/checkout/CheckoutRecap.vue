<script setup>
import { computed } from 'vue'
import GameRecap from '../game/GameRecap.vue'
import AppIcon from '../AppIcon.vue'
import DartPill from './DartPill.vue'
import { getCheckout } from '../../composables/useCheckouts.js'

const props = defineProps({
  variant: { type: String, required: true }, // 'quiz' | 'review'
  sessionStats: { type: Object, default: null }, // quiz
  results: { type: Array, default: () => [] }, // quiz, per question — absent for saved sessions
  reviewedCount: { type: Number, default: 0 }, // review
  reviewTotal: { type: Number, default: 0 }, // review
  // Read-only view of a saved session: no replay / home buttons
  hideActions: { type: Boolean, default: false },
})

const emit = defineEmits(['restart', 'home'])

const isQuiz = computed(() => props.variant === 'quiz')

const stats = computed(() => {
  const s = props.sessionStats
  return s ? [
    { label: 'Sorties trouvées', value: `${s.correct}/${s.questions}` },
    { label: 'Routes recommandées', value: s.optimal },
    { label: 'Meilleure série', value: s.bestStreak },
  ] : []
})

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
  <GameRecap
    v-if="isQuiz && sessionStats"
    tone="cyan"
    title="Sorties réussies"
    :percent="successRate"
    :badge-value="sessionStats.points"
    badge-label="points"
    :stats="stats"
    :stats-columns="3"
    list-title="Récap par question"
    :list-count="`${rows.length} question${rows.length > 1 ? 's' : ''}`"
    :hide-actions="hideActions"
    @primary="emit('restart')"
    @home="emit('home')"
  >
    <template v-if="rows.length" #legend>
      <div class="co-recap__legend">
        <span class="co-recap__legend-key"><span class="co-recap__swatch co-recap__swatch--optimal" />Recommandée ×2</span>
        <span class="co-recap__legend-key"><span class="co-recap__swatch co-recap__swatch--valid" />Autre route</span>
        <span class="co-recap__legend-key"><span class="co-recap__swatch co-recap__swatch--missed" />Ratée</span>
      </div>
    </template>

    <li v-for="row in rows" :key="row.key" class="co-recap__row" :class="`co-recap__row--${row.status}`">
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
    </li>
  </GameRecap>

  <GameRecap
    v-else
    tone="cyan"
    title="Checkouts acquis"
    :percent="reviewedCount"
    :unit="reviewTotal ? `/${reviewTotal}` : ''"
    :hide-actions="hideActions"
    @primary="emit('restart')"
    @home="emit('home')"
  />
</template>

<style lang="scss" scoped>
.co-recap {
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
  &__row--valid &__row-points { color: $orange-dark; }

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
}

@media (min-width: $bp-laptop) {
  .co-recap {
    &__legend     { gap: $gap-md; @include text-sm; }
    &__row-number { @include title-md; }
    &__row-score  { @include title-xxl; }
    &__row-status { @include text-xs; }
    &__row-points { @include title-xxl; }
  }
}
</style>
