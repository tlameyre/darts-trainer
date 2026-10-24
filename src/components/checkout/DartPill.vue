<script setup>
import { computed } from 'vue'
import { RED_SECTORS } from '../../data/dartboardSectors.js'

const props = defineProps({
  dart: { type: Object, required: true },
  size: { type: String, default: 'md', validator: v => ['sm', 'md'].includes(v) },
  // 'board' paints the pill with the dartboard colors of the hit segment
  tone: { type: String, default: 'board', validator: v => ['board', 'neutral', 'light', 'cyan', 'orange', 'green'].includes(v) },
  showPoints: { type: Boolean, default: false },
})
const colors = computed(() => {
  const { dart } = props
  if (props.tone !== 'board') return null
  if (dart.type === 'bull') {
    return dart.pts === 50
      ? { bg: 'var(--dart-red)', text: '#fff' }
      : { bg: 'var(--dart-green)', text: '#fff' }
  }
  const base = dart.sector
  const isRed = RED_SECTORS.has(base)
  if (dart.type === 'single') {
    return isRed
      ? { bg: 'var(--dart-black)', text: '#fff' }
      : { bg: 'var(--dart-cream)', text: 'var(--dart-cream-text)' }
  }
  return isRed
    ? { bg: 'var(--dart-red)', text: '#fff' }
    : { bg: 'var(--dart-green)', text: '#fff' }
})
</script>

<template>
  <span
    class="dart-pill"
    :class="[`dart-pill--${size}`, `dart-pill--${tone}`]"
    :style="colors && { background: colors.bg, color: colors.text }"
  >
    <span class="dart-pill__label">{{ dart.label }}</span>
    <span v-if="showPoints" class="dart-pill__pts">{{ dart.pts }}</span>
  </span>
</template>

<style lang="scss" scoped>
.dart-pill {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  font-variant-numeric: tabular-nums;

  &--sm {
    padding: 2px $padding-xxs;
    @include title-sm;
    line-height: 1.2;
  }

  &--md {
    min-width: 48px;
    height: 40px;
    padding: 0 $padding-xs;
    @include title-lg;
  }

  &__label { line-height: 1; }

  &__pts {
    @include text-xxs;
    opacity: 0.75;
  }

  &--neutral { background: $surface; color: $text-color; }
  &--light   { background: $white;   color: $text-color; }
  &--cyan    { background: $mode-checkout; color: $white; }
  &--orange  { background: $orange; color: $white; }
  &--green   { background: $accent; color: $white; }
}

@media (min-width: $bp-laptop) {
  .dart-pill--md {
    min-width: 56px;
    height: 48px;
    @include title-xxl;
  }

  .dart-pill__pts { @include text-xs; }
}
</style>
