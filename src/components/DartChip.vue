<script setup>
import { computed } from 'vue'

const props = defineProps({
  dart: { type: Object, required: true },
  showValue: { type: Boolean, default: false },
})

const TYPE_LABELS = {
  single: 'Simple',
  double: 'Double',
  triple: 'Triple',
  bull: 'Bull',
  miss: 'Raté',
}

// Secteurs rouges/noirs sur la cible (doubles/triples = rouge, simple = noir)
// Secteurs verts/crème (doubles/triples = vert, simple = crème)
const RED_NUMBERS = new Set([20, 18, 13, 10, 2, 3, 7, 8, 14, 12])

function getBaseNumber(dart) {
  if (dart.type === 'single') return dart.pts
  if (dart.type === 'double') return dart.pts / 2
  if (dart.type === 'triple') return dart.pts / 3
  return null
}

const chipColors = computed(() => {
  const { dart } = props

  if (dart.type === 'miss') {
    return { bg: 'var(--dart-miss-bg)', text: 'var(--dart-miss-text)', border: 'var(--dart-miss-border)' }
  }

  if (dart.type === 'bull') {
    // Double bull = rouge, simple bull = vert (comme la cible)
    return dart.pts === 50
      ? { bg: 'var(--dart-red)', text: '#fff', border: 'var(--dart-border)' }
      : { bg: 'var(--dart-green)', text: '#fff', border: 'var(--dart-border)' }
  }

  const n = getBaseNumber(dart)
  const isRed = RED_NUMBERS.has(n)

  if (dart.type === 'single') {
    // Simple rouge → fond noir, texte blanc
    // Simple vert  → fond crème, texte noir
    return isRed
      ? { bg: 'var(--dart-black)', text: '#fff', border: 'var(--dart-border)' }
      : { bg: 'var(--dart-cream)', text: 'var(--dart-cream-text)', border: 'var(--dart-border)' }
  }

  // Double ou Triple : couleur vive de la cible
  return isRed
    ? { bg: 'var(--dart-red)', text: '#fff', border: 'var(--dart-border)' }
    : { bg: 'var(--dart-green)', text: '#fff', border: 'var(--dart-border)' }
})
</script>

<template>
  <div class="dart-chip" :style="{
    background: chipColors.bg,
    color: chipColors.text,
    borderColor: chipColors.border,
  }">
    <div class="dart-chip__type">{{ TYPE_LABELS[dart.type] }}</div>
    <div class="dart-chip__label">{{ dart.label }}</div>
    <div v-if="showValue" class="dart-chip__pts">{{ dart.pts }} pts</div>
  </div>
</template>

<style lang="scss" scoped>
.dart-chip {
  flex: 1;
  border-radius: $radius-sm;
  padding: $padding-xs $padding-md;
  text-align: center;
  border: 2px solid transparent;

  &__type {
    @include text-xs;
  }

  &__label {
    @include title-xxl;
  }

  &__pts {
    @include text-xs;
  }
}
</style>
