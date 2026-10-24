<script setup>
import { BOARD_CELLS, BOARD_LABELS, SECTOR_ORDER } from '../../data/dartboardSectors.js'

// The one dartboard drawing of the app, rendered inside a parent <svg> sized to
// BOARD_SIZE. Parents style their states through `cellClass` / `labelClass`
// (with :deep) and draw their own overlays after it.
const props = defineProps({
  cellClass:  { type: Function, default: null }, // cell -> class
  labelClass: { type: Function, default: null }, // sector number -> class
  // Makes each sector (bull = null) a keyboard-focusable button emitting `sector`
  sectorAttrs: { type: Function, default: null }, // sector -> extra attrs (aria-*)
})

const emit = defineEmits(['sector'])

const groups = [...SECTOR_ORDER, null].map((sector) => ({
  sector,
  cells: BOARD_CELLS.filter((c) => c.sector === sector),
  label: BOARD_LABELS.find((l) => l.n === sector) ?? null,
}))

function onKey(e, sector) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('sector', sector)
  }
}
</script>

<template>
  <g class="dartboard-face">
    <g
      v-for="g in groups"
      :key="g.sector ?? 'bull'"
      class="dartboard-face__sector"
      v-bind="props.sectorAttrs ? { role: 'button', tabindex: 0, ...props.sectorAttrs(g.sector) } : {}"
      @click="props.sectorAttrs && emit('sector', g.sector)"
      @keydown="props.sectorAttrs && onKey($event, g.sector)"
    >
      <path
        v-for="cell in g.cells"
        :key="cell.key"
        class="dartboard-face__cell"
        :class="[`dartboard-face__cell--${cell.tone}`, cellClass?.(cell)]"
        :d="cell.d"
      />
      <text
        v-if="g.label"
        class="dartboard-face__number"
        :class="labelClass?.(g.sector)"
        :x="g.label.x"
        :y="g.label.y"
        text-anchor="middle"
        dominant-baseline="central"
      >{{ g.sector }}</text>
    </g>
  </g>
</template>

<style lang="scss" scoped>
.dartboard-face {
  &__sector {
    outline: none;

    &[role='button'] { cursor: pointer; }

    &:focus-visible .dartboard-face__cell { stroke: $black; }
  }

  &__cell {
    stroke: $dart-border;
    stroke-width: 1.2;
    transition: fill 0.15s;

    &--red   { fill: $dart-red; }
    &--green { fill: $dart-green; }
    &--black { fill: $dart-black; }
    &--cream { fill: $dart-cream; }
  }

  &__number {
    @include title-md;
    fill: $black;
    pointer-events: none;
  }
}
</style>
