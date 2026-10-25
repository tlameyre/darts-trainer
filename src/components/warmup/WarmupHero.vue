<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  tour: { type: Number, required: true },
  streak: { type: Number, default: 0 },
  timeDisplay: { type: String, required: true },
  isUnlimited: Boolean,
  isUrgent: Boolean,
  target: { type: String, required: true },
  stats: { type: Object, required: true }, // { total, hits, accuracy }
  rounds: { type: Array, default: () => [] }, // last completed volleys { tour, hits }, newest first
})

function roundTone(hits) {
  if (hits >= 2) return 'ok'
  return hits === 1 ? 'mid' : 'ko'
}
</script>

<template>
  <section class="warmup-hero">
    <div class="warmup-hero__status">
        <span class="warmup-hero__tour">Tour {{ tour }}</span>
        <span v-if="!isUnlimited" class="warmup-hero__timer" :class="{ 'warmup-hero__timer--urgent': isUrgent }">
          <AppIcon name="clock" :width="16" :height="16" />
          {{ timeDisplay }}
        </span>
        <span class="warmup-hero__streak">Série <span class="warmup-hero__streak-value">×{{ streak }}</span></span>
    </div>

    <div class="warmup-hero__middle">
      <div class="warmup-hero__target">
        <span class="warmup-hero__caption">Cible</span>
        <span class="warmup-hero__zone" :class="{ 'warmup-hero__zone--long': target.length > 3 }">{{ target }}</span>
      </div>

      <div v-if="rounds.length" class="warmup-hero__rounds">
        <span class="warmup-hero__caption">Derniers tours</span>
        <span
          v-for="round in rounds"
          :key="round.tour"
          class="warmup-hero__round-chip"
          :class="`warmup-hero__round-chip--${roundTone(round.hits)}`"
        >
          <span class="warmup-hero__round-tour">Tour {{ round.tour }}</span>
          <span class="warmup-hero__round-hits">{{ round.hits }}/3</span>
        </span>
      </div>
    </div>

    <div class="warmup-hero__stats">
      <div class="warmup-hero__stat">
        <span class="warmup-hero__stat-value">{{ stats.total }}</span>
        <span class="warmup-hero__stat-label">Jetées</span>
      </div>
      <div class="warmup-hero__stat">
        <span class="warmup-hero__stat-value">{{ stats.hits }}</span>
        <span class="warmup-hero__stat-label">Touchées</span>
      </div>
      <div class="warmup-hero__stat">
        <span class="warmup-hero__stat-value">{{ stats.accuracy }}%</span>
        <span class="warmup-hero__stat-label">Réussite</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.warmup-hero {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: $gap-sm;
  color: $white;

  &__status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  &__round {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__tour {
    @include title-lg;
  }

  &__streak {
    @include title-sm;
    display: flex;
    gap: $gap-xs;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: $black;
  }

  &__streak-value {
    color: $blue-light;
  }

  &__timer {
    @include title-xl;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-xs;
    border-radius: $radius-sm;
    background: rgba($black, 0.22);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);

    &--urgent {
      background: $error;
    }
  }

  &__middle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
    flex: 1;
  }

  &__target {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__rounds {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $gap-xxs;
  }

  &__round-chip {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $gap-xs;
    min-width: 96px;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: rgba($white, 0.16);

    // A volley without a single hit takes the "miss" style: red with white text
    &--ko {
      background: $error;
    }
  }

  &__round-tour {
    @include text-xs;
    opacity: 0.8;
  }

  &__round-hits {
    @include title-lg;
    line-height: 1;
  }

  &__round-chip--mid &__round-hits {
    color: $blue-light;
  }

  &__caption {
    @include text-xs;
    text-transform: uppercase;
    letter-spacing: $tracking-lg;
    opacity: 0.85;
  }

  &__zone {
    @include display-xl;
    line-height: 0.85;

    &--long {
      @include display-xs;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding-top: $padding-xs;
    border-top: $border-md solid rgba($white, 0.3);
  }

  &__stat {
    display: flex;
    flex-direction: column;
  }

  &__stat-value {
    @include title-xxl;
    line-height: 1;
  }

  &__stat-label {
    @include text-xs;
    opacity: 0.8;
  }
}

@media (min-width: $bp-laptop) {
  .warmup-hero {
    &__status { justify-content: end;}
    &__tour, &__streak { display: none;}
    &__timer  { position: inherit; transform: inherit; left: inherit; @include title-xxxl; padding: $padding-xs $padding-md; }
    &__caption { @include text-sm; }
    &__rounds  { gap: $gap-xs; padding-bottom: $padding-md; }

    &__round-chip {
      gap: $gap-sm;
      min-width: 132px;
      padding: $padding-xs $padding-sm;
    }

    &__round-tour { @include text-sm; }
    &__round-hits { @include title-xl; }

    &__zone {
      @include display-xxl;

      &--long { @include display-md; }
    }

    &__stats      { padding-top: $padding-md; }
    &__stat-value { @include display-xs; }
    &__stat-label { @include text-md; }
  }
}
</style>
