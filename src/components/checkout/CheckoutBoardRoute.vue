<script setup>
import { computed } from 'vue'
import DartboardFace from '../game/DartboardFace.vue'
import { BOARD_SIZE, bandPath, bandCenter } from '../../data/dartboardSectors.js'

const props = defineProps({
  route: { type: Array, default: () => [] }, // Dart[] { type, sector, pts, label }
  tone: { type: String, default: 'cyan', validator: (v) => ['cyan', 'ink'].includes(v) },
})

// Dart -> aimed band (a single aims at the big outer single)
function ringOf(dart) {
  if (dart.type === 'double') return 'double'
  if (dart.type === 'triple') return 'triple'
  if (dart.type === 'bull') return dart.pts === 50 ? 'bull-inner' : 'bull-outer'
  return 'single-outer'
}

function dartTarget(dart) {
  const ring = ringOf(dart)
  const sector = dart.type === 'bull' ? null : dart.sector
  return { ring, sector, key: `${ring}:${sector}` }
}

// Darts grouped by band: two darts on the same spot share one "1 - 2" badge
const marks = computed(() => {
  const groups = new Map()
  props.route.forEach((dart, i) => {
    const t = dartTarget(dart)
    if (!groups.has(t.key)) {
      groups.set(t.key, {
        key: t.key,
        path: bandPath(t.sector, t.ring),
        ...bandCenter(t.sector, t.ring),
        orders: [],
      })
    }
    groups.get(t.key).orders.push(i + 1)
  })
  return [...groups.values()].map((g) => ({ ...g, label: g.orders.join(' - ') }))
})

const linePoints = computed(() => {
  if (props.route.length < 2) return null
  return props.route
    .map((dart) => {
      const t = dartTarget(dart)
      const c = bandCenter(t.sector, t.ring)
      return `${c.x},${c.y}`
    })
    .join(' ')
})

const badgeW = (label) => 24 + Math.max(0, label.length - 1) * 6
</script>

<template>
  <svg class="board" :class="`board--${tone}`" :viewBox="`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`" xmlns="http://www.w3.org/2000/svg">
    <DartboardFace />

    <path v-for="m in marks" :key="`hl-${m.key}`" class="board__target" :d="m.path" />
    <template v-if="linePoints">
      <polyline class="board__link board__link--halo" :points="linePoints" />
      <polyline class="board__link" :points="linePoints" />
    </template>

    <g v-for="m in marks" :key="`badge-${m.key}`" class="board__badge">
      <rect
        :x="m.x - badgeW(m.label) / 2"
        :y="m.y - 12"
        :width="badgeW(m.label)"
        height="24"
        rx="12"
      />
      <text :x="m.x" :y="m.y">{{ m.label }}</text>
    </g>
  </svg>
</template>

<style lang="scss" scoped>
.board {
  // Target cells / badge outline, and the dashed route line
  --route-target: #{$mode-checkout};
  --route-line: #{$mode-checkout};

  display: block;
  width: min(100%, 100cqh);
  aspect-ratio: 1;
  margin: 0 auto;

  &--ink {
    --route-target: #{$error-light};
    --route-line: #{$black};
  }
}

.board__target {
  fill: var(--route-target);
  stroke: $dart-border;
  stroke-width: 1.1;
}

// Dashed cyan route over a white halo so it reads on every segment color
.board__link {
  fill: none;
  stroke: var(--route-line);
  stroke-width: 4;
  stroke-dasharray: 3 9;
  stroke-linecap: round;

  &--halo {
    stroke: $white;
    stroke-width: 7;
  }
}

.board__badge {
  rect {
    fill: $black;
    stroke: var(--route-target);
    stroke-width: 2.5;
  }

  text {
    fill: $white;
    @include title-sm;
    text-anchor: middle;
    dominant-baseline: central;
  }
}
</style>
