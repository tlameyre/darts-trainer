<script setup>
defineProps({
  stats:      { type: Object, required: true },
  legsPlayed: { type: Number, required: true },
  startScore: { type: Number, required: true },
})

defineEmits(['replay', 'home'])
</script>

<template>
  <div class="result">
    <div class="result__top">
      <div class="result__emoji">🎯</div>
      <h2 class="result__title">Partie terminée !</h2>
      <p class="result__subtitle">
        {{ legsPlayed }} manche{{ legsPlayed > 1 ? 's' : '' }} · {{ startScore }} points
      </p>
    </div>

    <div class="result__grid">

      <div class="result__stat result__stat--highlight">
        <span class="result__stat-value">{{ stats.avgVolley }}</span>
        <span class="result__stat-label">Moy. volée</span>
      </div>

      <div class="result__stat result__stat--highlight">
        <span class="result__stat-value">{{ stats.avg9darts }}</span>
        <span class="result__stat-label">Moy. 9 fléchettes</span>
      </div>

      <div class="result__stat">
        <span class="result__stat-value">{{ stats.avgDartsToFinish }}</span>
        <span class="result__stat-label">Moy. fléchettes / manche</span>
      </div>

      <div class="result__stat">
        <span class="result__stat-value">{{ stats.highestFinish }}</span>
        <span class="result__stat-label">Plus haut finish</span>
      </div>

      <div class="result__stat">
        <span class="result__stat-value">{{ stats.highestVolley }}</span>
        <span class="result__stat-label">Volée la plus haute</span>
      </div>

      <div class="result__stat result__stat--double">
        <div class="result__stat-pair">
          <div>
            <span class="result__stat-value">{{ stats.minDarts }}</span>
            <span class="result__stat-label">Min fléchettes</span>
          </div>
          <div class="result__stat-sep">—</div>
          <div>
            <span class="result__stat-value">{{ stats.maxDarts }}</span>
            <span class="result__stat-label">Max fléchettes</span>
          </div>
        </div>
      </div>

    </div>

    <div class="result__actions">
      <button class="result__btn result__btn--secondary" @click="$emit('home')">
        Retour au lobby
      </button>
      <button class="result__btn result__btn--primary" @click="$emit('replay')">
        Rejouer
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: $gap-xl;
  padding: $padding-lg 0;
  flex: 1;
  overflow-y: auto;

  &__top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
  }

  &__emoji {
    @include title-xxxl;
    line-height: 1;
  }

  &__title {
    @include title-xxl;
    color: $white;
  }

  &__subtitle {
    @include text-sm;
    color: $muted;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-sm;
  }

  &__stat {
    background: rgba($white, 0.06);
    border-radius: $radius-md;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;

    &--highlight {
      background: rgba(#16a34a, 0.18);
      border: $border-sm solid rgba(#16a34a, 0.35);
    }

    &--double {
      grid-column: 1 / -1;
    }
  }

  &__stat-value {
    @include text-xxl;
    font-weight: 600;
    color: $white;
    line-height: 1;
  }

  &__stat-label {
    @include title-xs;
    color: $muted;
    line-height: 1.3;
  }

  &__stat-pair {
    display: flex;
    align-items: center;
    justify-content: space-around;
    text-align: center;
  }

  &__stat-sep {
    @include title-lg;
    color: $muted;
  }

  &__actions {
    display: flex;
    gap: $gap-sm;
    margin-top: auto;
  }

  &__btn {
    flex: 1;
    padding: $padding-md;
    border-radius: $radius-sm;
    @include title-md;
    font-weight: 700;
    text-transform: uppercase;
    transition: opacity 0.15s;

    &:active { opacity: 0.75; }

    &--primary {
      background: $orange;
      color: $white;
    }

    &--secondary {
      background: rgba($white, 0.08);
      color: $white;
    }
  }
}
</style>
