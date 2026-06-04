<script setup>
defineProps({
  // { name, remaining, legsWon, legsToWin, lastDarts, avgVolley, lastScore, totalDarts }
  human: { type: Object, required: true },
  // { profileLabel, level, remaining, legsWon, legsToWin, lastScore, avgVolley, totalDarts, isThinking }
  ai:           { type: Object,  default: null },
  activePlayer: { type: String,  default: 'human' }, // 'human' | 'ai'
  solo:         { type: Boolean, default: false },
})
</script>

<template>
  <div class="split-card" :class="{ 'split-card--solo': solo }">

    <!-- ── Joueur humain ──────────────────────────────────────────────────── -->
    <div class="split-card__half split-card__half--human"
         :class="{ 'split-card__half--active': activePlayer === 'human' }">

      <div class="split-card__header">
        <span class="split-card__active-dot" :class="{ 'split-card__active-dot--on': activePlayer === 'human' }" />
        <div class="split-card__avatar">{{ human.name?.[0]?.toUpperCase() ?? '?' }}</div>
        <span class="split-card__name">{{ human.name }}</span>
      </div>

      <div class="split-card__score-row">
        <span class="split-card__score">{{ human.remaining }}</span>
        <span class="split-card__legs-badge">{{ human.legsWon }}</span>
      </div>

      <div class="split-card__darts">
        <template v-if="human.lastDarts?.length">
          <span v-for="(d, i) in human.lastDarts" :key="i" class="split-card__dart-chip">
            {{ d.label }}
          </span>
        </template>
        <span v-else class="split-card__dart-chip split-card__dart-chip--empty">–</span>
      </div>

      <div class="split-card__stats">
        <div class="split-card__stat-row">
          <span class="split-card__stat-label">Moyenne</span>
          <span class="split-card__stat-val">{{ human.avgVolley ?? '–' }}</span>
        </div>
        <div class="split-card__stat-row">
          <span class="split-card__stat-label">Score précédent</span>
          <span class="split-card__stat-val">{{ human.lastScore != null ? human.lastScore : '–' }}</span>
        </div>
        <div class="split-card__stat-row">
          <span class="split-card__stat-label">Fléchettes jetées</span>
          <span class="split-card__stat-val">{{ human.totalDarts }}</span>
        </div>
      </div>
    </div>

    <!-- ── IA ────────────────────────────────────────────────────────────── -->
    <div v-if="!solo" class="split-card__half split-card__half--ai"
         :class="{ 'split-card__half--active': activePlayer === 'ai' }">

      <div class="split-card__header">
        <span class="split-card__active-dot" :class="{ 'split-card__active-dot--on': activePlayer === 'ai' }" />
        <div class="split-card__avatar split-card__avatar--ai">🤖</div>
        <span class="split-card__name">DartBot</span>
        <span class="split-card__level-badge">{{ ai.level != null ? 'Lv. ' + ai.level : 'Custom' }}</span>
      </div>

      <div class="split-card__score-row">
        <span class="split-card__score">{{ ai.remaining }}</span>
        <span class="split-card__legs-badge">{{ ai.legsWon }}</span>
      </div>

      <div class="split-card__darts">
        <template v-if="ai.isThinking">
          <span class="split-card__dart-chip split-card__dart-chip--thinking">
            <span class="split-card__think-dot" />
            <span class="split-card__think-dot" />
            <span class="split-card__think-dot" />
          </span>
        </template>
        <template v-else-if="ai.lastScore != null">
          <span class="split-card__dart-chip">{{ ai.lastScore > 0 ? ai.lastScore : 'MISS' }}</span>
        </template>
        <span v-else class="split-card__dart-chip split-card__dart-chip--empty">–</span>
      </div>

      <div class="split-card__stats">
        <div class="split-card__stat-row">
          <span class="split-card__stat-label">Moyenne</span>
          <span class="split-card__stat-val">{{ ai.avgVolley ?? '–' }}</span>
        </div>
        <div class="split-card__stat-row">
          <span class="split-card__stat-label">Score précédent</span>
          <span class="split-card__stat-val">{{ ai.lastScore != null ? ai.lastScore : '–' }}</span>
        </div>
        <div class="split-card__stat-row">
          <span class="split-card__stat-label">Fléchettes jetées</span>
          <span class="split-card__stat-val">{{ ai.totalDarts }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.split-card {
  display: flex;
  border-radius: $radius-lg;
  overflow: hidden;
  flex: 1;

  &__half {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-md;
    background: $orange;
    transition: background 0.25s;

    &--human { border-radius: $radius-lg 0 0 $radius-lg; }
    .split-card--solo &--human { border-radius: $radius-lg; }
    &--ai    {
      border-radius: 0 $radius-lg $radius-lg 0;
      background: color-mix(in srgb, $orange 85%, #f5a623 15%);
    }

    &--active { background: $orange; }
    &:not(&--active) { background: color-mix(in srgb, $orange 78%, #000 22%); }
  }

  // ── Header ───────────────────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    min-width: 0;
  }

  &__active-dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: rgba($white, 0.3);
    flex-shrink: 0;
    transition: background 0.2s;

    &--on { background: $white; }
  }

  &__avatar {
    width: 28px;
    height: 28px;
    border-radius: $radius-pill;
    background: rgba($white, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-xs;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;

    &--ai { font-size: 16px; }
  }

  &__name {
    @include text-sm;
    font-weight: 600;
    color: rgba($white, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  &__level-badge {
    @include text-xs;
    font-weight: 700;
    background: rgba($white, 0.2);
    color: $white;
    border-radius: $radius-pill;
    padding: 3px 8px;
    flex-shrink: 0;
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  &__score-row {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    flex: 1;
  }

  &__score {
    @include display-md;
    font-weight: 700;
    color: $white;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: color 0.2s;
  }

  &__legs-badge {
    @include title-sm;
    font-weight: 700;
    color: $white;
    background: rgba($black, 0.7);
    border-radius: $radius-sm;
    padding: 4px 10px;
    flex-shrink: 0;
  }

  // ── Darts chips ───────────────────────────────────────────────────────────
  &__darts {
    display: flex;
    gap: $gap-xxs;
    flex-wrap: wrap;
  }

  &__dart-chip {
    background: rgba($black, 0.5);
    border-radius: $radius-sm;
    padding: 3px 9px;
    @include title-xs;
    font-weight: 700;
    color: $white;

    &--empty { color: rgba($white, 0.4); background: rgba($black, 0.3); }

    &--thinking {
      display: flex;
      gap: 3px;
      align-items: center;
      background: rgba($black, 0.3);
      padding: 6px 10px;
    }
  }

  &__think-dot {
    width: 4px;
    height: 4px;
    border-radius: $radius-pill;
    background: rgba($white, 0.8);
    animation: think-blink 1.2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  &__stats {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  &__stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__stat-label {
    @include text-xs;
    color: rgba($white, 0.7);
  }

  &__stat-val {
    @include title-md;
    font-weight: 700;
    color: $white;
    font-variant-numeric: tabular-nums;
  }
}

@keyframes think-blink {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1.1); }
}

@media (min-width: $bp-tablet) {
  .split-card {
    flex-direction: column;

    &__half {
      gap: $gap-sm;

      &--human { border-radius: $radius-lg $radius-lg 0 0; }
      &--ai    { border-radius: 0 0 $radius-lg $radius-lg; background: color-mix(in srgb, $orange 85%, #f5a623 15%); }
    }

    &__name       { @include text-md; }
    &__score      { @include display-md; }
    &__stat-label { @include text-sm; }
    &__stat-val   { @include title-lg; }
    &__dart-chip  { @include title-sm; padding: 4px 10px; }
  }
}

@media (min-width: $bp-laptop) {
  .split-card {
    &__half {
      padding: $padding-md $padding-lg;
    }

    &__avatar     { width: 40px; height: 40px; }
    &__name       { @include text-lg; }
    &__score      { @include display-lg; }
    &__stat-label { @include text-md; }
    &__stat-val   { @include title-xxl; }
    &__dart-chip  { @include title-md; padding: 5px 12px; }
  }
}
</style>
