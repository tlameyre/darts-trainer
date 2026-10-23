<script setup>
import { computed } from 'vue'

const props = defineProps({
  days: { type: Array, required: true },
  modes: { type: Array, required: true },
})

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
// A quiet week never fills the bars: at least this many sessions for a full one
const MIN_SCALE = 3

const total = computed(() =>
  props.days.reduce((sum, day) => sum + Object.values(day.counts).reduce((a, b) => a + b, 0), 0)
)

const bars = computed(() => {
  const totals = props.days.map((day) => Object.values(day.counts).reduce((a, b) => a + b, 0))
  const scale = Math.max(MIN_SCALE, ...totals)
  return props.days.map((day, i) => ({
    label: DAY_LABELS[i],
    isToday: day.isToday,
    segments: props.modes
      .filter((mode) => day.counts[mode.id])
      .map((mode) => ({ id: mode.id, color: mode.color, height: `${(day.counts[mode.id] / scale) * 100}%` })),
  }))
})
</script>

<template>
  <section class="week">
    <div class="week__head">
      <h2 class="week__title">Ta semaine</h2>
      <span class="week__total">{{ total }} session{{ total > 1 ? 's' : '' }}</span>
    </div>

    <div class="week__days">
      <div v-for="(bar, i) in bars" :key="i" class="week__day">
        <div class="week__bar">
          <span
            v-for="seg in bar.segments" :key="seg.id"
            class="week__segment"
            :style="{ height: seg.height, background: seg.color }"
          />
          <span v-if="!bar.segments.length" class="week__segment week__segment--empty" />
        </div>
        <span class="week__label" :class="{ 'week__label--today': bar.isToday }">{{ bar.label }}</span>
      </div>
    </div>

    <ul class="week__legend">
      <li v-for="mode in modes" :key="mode.id" class="week__legend-item">
        <span class="week__swatch" :style="{ background: mode.color }" />
        {{ mode.label }}
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.week {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  padding: $padding-md;
  border-radius: $radius-sm;
  background: $black;
  color: $bg;

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  &__title { @include title-lg; }

  &__total {
    @include text-xs;
    opacity: 0.7;
  }

  &__days {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__day {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__bar {
    display: flex;
    flex-direction: column-reverse;
    gap: 2px;
    height: 56px;
  }

  &__segment {
    flex-shrink: 0;
    border-radius: $radius-xs;

    &--empty {
      height: 4px;
      background: rgba($bg, 0.2);
    }
  }

  &__label {
    @include text-xxs;
    text-align: center;
    opacity: 0.7;

    &--today {
      color: $error-light;
      opacity: 1;
    }
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-sm;
    padding-top: $padding-xs;
    border-top: $border-md solid rgba($bg, 0.2);
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    @include text-xs;
    opacity: 0.85;
  }

  &__swatch {
    width: 10px;
    height: 10px;
    border-radius: $radius-xs;
  }
}

@media (min-width: $bp-laptop) {
  .week {
    padding: $padding-lg;

    &__title { @include title-xl; }
    &__total { @include text-sm; }
    &__days { gap: $gap-sm; }
    &__bar { height: 112px; }
    &__label { @include text-xs; }
    &__legend-item { @include text-sm; }
  }
}
</style>
