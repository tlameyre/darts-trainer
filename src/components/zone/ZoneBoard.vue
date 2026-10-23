<script setup>
import { computed } from 'vue'
import { useZoneSelection } from '../../composables/useZoneSelection.js'

const props = defineProps({
  modelValue: { required: true },
  multiple: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const { activeType, isSelected, selectSector } = useZoneSelection(props, emit)

// Clockwise from the top, as on a real board
const SECTORS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]

const C = 170 // viewBox center
// Ring radii, outside in: double, outer single, triple, inner single
const RINGS = [
  { kind: 'd', outer: 150, inner: 140 },
  { kind: 's', outer: 140, inner: 92 },
  { kind: 't', outer: 92, inner: 82 },
  { kind: 's', outer: 82, inner: 14 },
]
const LABEL_RADIUS = 160
// Regulation board scaled to a 150 double radius (170mm): 25 = 15.9mm, 50 = 6.35mm
const BULL_OUTER = 14
const BULL_INNER = 5.6

// Ring kinds covered by each generic type
const TYPE_RINGS = { A: ['d', 's', 't'], S: ['s'], D: ['d'], T: ['t'] }

function point(r, deg) {
  const rad = (deg * Math.PI) / 180
  return `${(C + r * Math.cos(rad)).toFixed(1)} ${(C + r * Math.sin(rad)).toFixed(1)}`
}

function annulus(outer, inner, from, to) {
  return `M${point(outer, from)}A${outer} ${outer} 0 0 1 ${point(outer, to)}`
    + `L${point(inner, to)}A${inner} ${inner} 0 0 0 ${point(inner, from)}Z`
}

const sectors = computed(() => {
  const rings = TYPE_RINGS[activeType.value]
  return SECTORS.map((n, i) => {
    const mid = -90 + i * 18
    const dark = i % 2 === 0 // red/black sectors alternate with green/cream ones
    const selected = isSelected(n)
    const labelAt = point(LABEL_RADIUS, mid).split(' ')
    return {
      n,
      selected,
      label: { x: labelAt[0], y: labelAt[1] },
      rings: RINGS.map(ring => {
        const tone = ring.kind === 's' ? (dark ? 'black' : 'cream') : (dark ? 'red' : 'green')
        const on = selected && rings.includes(ring.kind)
        return {
          d: annulus(ring.outer, ring.inner, mid - 9, mid + 9),
          cls: on ? `board__cell--${ring.kind === 's' ? 'on-light' : 'on'}` : `board__cell--${tone}`,
        }
      }),
    }
  })
})

const bull = computed(() => {
  const selected = isSelected(null)
  const type = activeType.value
  return {
    selected,
    outer: selected && type !== 'D' ? 'board__cell--on-light' : 'board__cell--green',
    inner: selected && type !== 'S' ? 'board__cell--on' : 'board__cell--red',
  }
})

function onKey(e, sector) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    selectSector(sector)
  }
}
</script>

<template>
  <svg class="board" viewBox="0 0 340 340" role="group" aria-label="Cible — choisir les zones">
    <g
      v-for="s in sectors"
      :key="s.n"
      class="board__sector"
      role="button"
      tabindex="0"
      :aria-pressed="s.selected"
      :aria-label="`Secteur ${s.n}`"
      @click="selectSector(s.n)"
      @keydown="onKey($event, s.n)"
    >
      <path v-for="(ring, i) in s.rings" :key="i" :d="ring.d" class="board__cell" :class="ring.cls" />
      <text
        :x="s.label.x" :y="s.label.y"
        class="board__number" :class="{ 'board__number--on': s.selected }"
        text-anchor="middle" dominant-baseline="central"
      >{{ s.n }}</text>
    </g>

    <g
      class="board__sector"
      role="button"
      tabindex="0"
      :aria-pressed="bull.selected"
      aria-label="Bull"
      @click="selectSector(null)"
      @keydown="onKey($event, null)"
    >
      <circle :cx="C" :cy="C" :r="BULL_OUTER" class="board__cell" :class="bull.outer" />
      <circle :cx="C" :cy="C" :r="BULL_INNER" class="board__cell" :class="bull.inner" />
    </g>
  </svg>
</template>

<style lang="scss" scoped>
.board {
  display: block;
  width: 100%;
  height: 100%;

  &__sector {
    cursor: pointer;
    outline: none;

    &:focus-visible .board__cell {
      stroke: $black;
    }
  }

  &__cell {
    stroke: $dart-border;
    stroke-width: 1.2;
    transition: fill 0.15s;

    &--red      { fill: $dart-red; }
    &--green    { fill: $dart-green; }
    &--black    { fill: $dart-black; }
    &--cream    { fill: $dart-cream; }
    &--on       { fill: $blue; }
    &--on-light { fill: $blue-light; }
  }

  &__number {
    @include title-md;
    fill: $black;

    &--on {
      fill: $blue;
    }
  }
}
</style>
