<script setup>
import { computed } from 'vue'

// Grouped bars: how many visits each player scored per range (60+ … 180)
const props = defineProps({
  players: { type: Array, required: true }, // [{ name }] in turn order (colors follow the index)
  stats:   { type: Array, required: true }, // computePlayerStats() per player, with .buckets
})

const BUCKETS = [
  { key: 60,  label: '60+' },
  { key: 80,  label: '80+' },
  { key: 100, label: '100+' },
  { key: 140, label: '140+' },
  { key: 180, label: '180' },
]

const groups = computed(() => {
  const counts = BUCKETS.map(b => props.stats.map(s => s.buckets?.[b.key] ?? 0))
  const top = Math.max(1, ...counts.flat())
  return BUCKETS.map((b, gi) => ({
    label: b.label,
    bars: counts[gi].map(count => ({ count, height: Math.max(3, Math.round((count * 80) / top)) })),
  }))
})
</script>

<template>
  <section class="visits">
    <h3 class="visits__title">Volées</h3>

    <div class="visits__legend">
      <span v-for="(p, i) in players" :key="i" class="visits__key">
        <span class="visits__swatch" :class="`visits__swatch--p${i}`" />
        {{ p.name }}
      </span>
    </div>

    <div class="visits__chart" :class="{ 'visits__chart--crowded': players.length > 3 }">
      <div v-for="group in groups" :key="group.label" class="visits__group">
        <div class="visits__bars">
          <div v-for="(bar, i) in group.bars" :key="i" class="visits__bar">
            <span class="visits__count">{{ bar.count }}</span>
            <span class="visits__fill" :class="`visits__fill--p${i}`" :style="{ height: `${bar.height}%` }" />
          </div>
        </div>
        <span class="visits__label">{{ group.label }}</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.visits {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__title {
    @include title-lg;
    padding: $padding-xs 0;
    border-bottom: $border-lg solid $text-color;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs $gap-md;
  }

  &__key {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include text-sm;
    font-weight: 600;
  }

  &__swatch,
  &__fill {
    @each $i, $color in $player-colors {
      &--p#{$i} { background: $color; }
    }
  }

  &__swatch {
    width: 12px;
    height: 12px;
    border-radius: $radius-xs;
  }

  &__chart {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $gap-sm;
    padding-top: $padding-xxs;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    min-width: 0;
  }

  &__bars {
    height: 120px;
    display: flex;
    align-items: flex-end;
    gap: $gap-xxs;
  }

  &__chart--crowded &__bars { gap: 2px; }

  &__bar {
    flex: 1;
    min-width: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: $gap-xxs;
  }

  &__count {
    @include title-sm;
    font-variant-numeric: tabular-nums;
  }

  &__chart--crowded &__count { @include title-xxs; }

  &__fill {
    width: 100%;
    border-radius: $radius-xs $radius-xs 0 0;
  }

  &__label {
    @include title-sm;
    text-align: center;
    padding-top: $padding-xxs;
    border-top: $border-md solid $text-color;
  }
}

@media (min-width: $bp-laptop) {
  .visits {
    &__title { @include title-xxl; }
    &__key   { @include text-md; }
    &__bars  { height: 200px; }
    &__count { @include title-md; }
    &__label { @include title-md; }
  }
}
</style>
