<script setup>
import { computed } from 'vue'

const props = defineProps({
  dart: { type: Object, required: true },
})

const TYPE_LABELS = {
  single: 'Simple',
  double: 'Double',
  triple: 'Triple',
  bull:   'Bull',
  miss:   'Raté',
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
    return { bg: 'rgba(0,0,0,0.22)', text: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)' }
  }

  if (dart.type === 'bull') {
    // Double bull = rouge, simple bull = vert (comme la cible)
    return dart.pts === 50
      ? { bg: '#bf3a28', text: '#ffffff', border: 'rgba(255,255,255,0.55)' }
      : { bg: '#1a9147', text: '#ffffff', border: 'rgba(255,255,255,0.55)' }
  }

  const n = getBaseNumber(dart)
  const isRed = RED_NUMBERS.has(n)

  if (dart.type === 'single') {
    // Simple rouge → fond noir, texte blanc
    // Simple vert  → fond crème, texte noir
    return isRed
      ? { bg: '#1a1a1a',  text: '#ffffff', border: 'rgba(255,255,255,0.18)' }
      : { bg: '#f0e8d0',  text: '#111111', border: 'rgba(0,0,0,0.12)' }
  }

  // Double ou Triple : couleur vive de la cible
  return isRed
    ? { bg: '#c0392b', text: '#ffffff', border: 'rgba(255,255,255,0.6)' }
    : { bg: '#1a9147', text: '#ffffff', border: 'rgba(255,255,255,0.6)' }
})
</script>

<template>
  <div
    class="dart-chip"
    :style="{
      background: chipColors.bg,
      color: chipColors.text,
      borderColor: chipColors.border,
    }"
  >
    <div class="dart-chip__type">{{ TYPE_LABELS[dart.type] }}</div>
    <div class="dart-chip__label">{{ dart.label }}</div>
    <div class="dart-chip__pts">{{ dart.pts }} pts</div>
  </div>
</template>

<style lang="scss" scoped>
.dart-chip {
  flex: 1;
  border-radius: $radius-md;
  padding: 8px 6px;
  text-align: center;
  border: 2px solid transparent;

  &__type {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 700;
    opacity: 0.6;
    margin-bottom: 3px;
  }

  &__label {
    font-family: $font-display;
    font-size: 20px;
    line-height: 1;
  }

  &__pts {
    font-size: 10px;
    opacity: 0.55;
    margin-top: 2px;
  }
}
</style>
