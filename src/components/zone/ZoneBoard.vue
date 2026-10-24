<script setup>
import DartboardFace from '../game/DartboardFace.vue'
import { useZoneSelection } from '../../composables/useZoneSelection.js'
import { BOARD_SIZE } from '../../data/dartboardSectors.js'

const props = defineProps({
  modelValue: { required: true },
  multiple: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const { activeType, isSelected, selectSector } = useZoneSelection(props, emit)

// Rings covered by each generic type
const TYPE_RINGS = {
  A: ['double', 'single-outer', 'triple', 'single-inner', 'bull-outer', 'bull-inner'],
  S: ['single-outer', 'single-inner', 'bull-outer'],
  D: ['double', 'bull-inner'],
  T: ['triple', 'bull-outer', 'bull-inner'],
}

function cellClass(cell) {
  if (!isSelected(cell.sector) || !TYPE_RINGS[activeType.value].includes(cell.ring)) return null
  const light = cell.ring.startsWith('single') || cell.ring === 'bull-outer'
  return light ? 'board__cell--on-light' : 'board__cell--on'
}

const labelClass = (sector) => (isSelected(sector) ? 'board__number--on' : null)

const sectorAttrs = (sector) => ({
  'aria-pressed': isSelected(sector),
  'aria-label': sector == null ? 'Bull' : `Secteur ${sector}`,
})
</script>

<template>
  <svg class="board" :viewBox="`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`" role="group" aria-label="Cible — choisir les zones">
    <DartboardFace
      :cell-class="cellClass"
      :label-class="labelClass"
      :sector-attrs="sectorAttrs"
      @sector="selectSector"
    />
  </svg>
</template>

<style lang="scss" scoped>
.board {
  display: block;
  width: 100%;
  height: 100%;

  :deep(.board__cell--on)       { fill: $blue; }
  :deep(.board__cell--on-light) { fill: $blue-light; }
  :deep(.board__number--on)     { fill: $blue; }
}
</style>
