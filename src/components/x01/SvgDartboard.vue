<script setup>
import { ref, computed, watch } from 'vue'
import { BOARD_SIZE, cellAt } from '../../data/dartboardSectors.js'
import AppIcon from '../AppIcon.vue'
import DartboardFace from '../game/DartboardFace.vue'

const props = defineProps({
  locked: { type: Boolean, default: false },
  // When true (and on a touch pointer): a short tap selects the touched point,
  // a long press zooms the board in on that spot and stays zoomed so thin rings
  // can be picked. The zoomed view can't be panned — long-press again to
  // re-centre, or use the reset button.
  zoomable: { type: Boolean, default: false },
  // When true, the board grows to the largest square that fits its parent, bounded
  // by both width and height, instead of the fixed max-width. The parent must
  // establish a size container (`container-type: size`) with a constrained height.
  fill: { type: Boolean, default: false },
})

const emit = defineEmits(['dart'])

const ZOOM = 3
const HOLD_MS = 250 // press held this long zooms in
const TAP_SLOP = 10 // px of travel still counts as a tap; more cancels the zoom

const zoomEnabled = props.zoomable && window.matchMedia?.('(pointer: coarse)').matches

const svgEl = ref(null)
const zoomCenter = ref(null) // { x, y } in SVG coords while zoomed, else null
const zoomed = ref(false)

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

const viewBox = computed(() => {
  if (!zoomCenter.value) return `0 0 ${BOARD_SIZE} ${BOARD_SIZE}`
  const w = BOARD_SIZE / ZOOM
  const x = clamp(zoomCenter.value.x - w / 2, 0, BOARD_SIZE - w)
  const y = clamp(zoomCenter.value.y - w / 2, 0, BOARD_SIZE - w)
  return `${x} ${y} ${w} ${w}`
})

// Screen point -> point in the current (possibly zoomed) SVG coordinate space.
function clientToSvg(cx, cy) {
  const rect = svgEl.value.getBoundingClientRect()
  const [vx, vy, vw, vh] = viewBox.value.split(' ').map(Number)
  return {
    x: vx + ((cx - rect.left) / rect.width) * vw,
    y: vy + ((cy - rect.top) / rect.height) * vh,
  }
}

function segAtClient(cx, cy) {
  const p = clientToSvg(cx, cy)
  return cellAt(p.x, p.y)
}

const pressedKey = ref(null)
let _pressTimer = null

function buildDart(seg) {
  if (seg.ring === 'bull-outer') return { type: 'bull', sector: null, pts: 25, label: 'Outer' }
  if (seg.ring === 'bull-inner') return { type: 'bull', sector: null, pts: 50, label: 'Bull' }
  if (seg.ring === 'double') return { type: 'double', sector: seg.sector, pts: seg.sector * 2, label: `D${seg.sector}` }
  if (seg.ring === 'triple') return { type: 'triple', sector: seg.sector, pts: seg.sector * 3, label: `T${seg.sector}` }
  return { type: 'single', sector: seg.sector, pts: seg.sector, label: String(seg.sector) }
}

function flash(seg) {
  clearTimeout(_pressTimer)
  pressedKey.value = seg.key
  _pressTimer = setTimeout(() => { pressedKey.value = null }, 160)
}

// ─── Pointer gesture: short tap selects, long press zooms ────────────
let holdTimer = null
let downClient = null
let moved = false
let holdFired = false

function onPointerDown(e) {
  if (props.locked) return
  try { svgEl.value?.setPointerCapture(e.pointerId) } catch { /* pointer already released */ }
  downClient = { x: e.clientX, y: e.clientY }
  moved = false
  holdFired = false
  clearTimeout(holdTimer)
  if (zoomEnabled) holdTimer = setTimeout(() => zoomAt(downClient), HOLD_MS)
}

function onPointerMove(e) {
  if (!downClient || moved) return
  if (Math.hypot(e.clientX - downClient.x, e.clientY - downClient.y) > TAP_SLOP) {
    moved = true
    clearTimeout(holdTimer)
  }
}

function zoomAt(pt) {
  const p = clientToSvg(pt.x, pt.y)
  zoomCenter.value = { x: clamp(p.x, 0, BOARD_SIZE), y: clamp(p.y, 0, BOARD_SIZE) }
  zoomed.value = true
  holdFired = true
}

function onPointerUp(e) {
  clearTimeout(holdTimer)
  if (!downClient) return
  if (!holdFired && !moved) {
    const seg = segAtClient(e.clientX, e.clientY)
    if (seg) {
      flash(seg)
      emit('dart', buildDart(seg))
      resetZoom()
    }
  }
  endGesture()
}

function endGesture() {
  clearTimeout(holdTimer)
  downClient = null
  moved = false
  holdFired = false
}

function resetZoom() {
  zoomed.value = false
  zoomCenter.value = null
}

watch(() => props.locked, (v) => { if (v) { resetZoom(); endGesture() } })

const cellClass = (cell) => (cell.key === pressedKey.value ? 'dartboard__cell--pressed' : null)
</script>

<template>
  <div class="dartboard-wrap" :class="{ 'dartboard-wrap--fill': fill }">
    <svg
      ref="svgEl"
      class="dartboard"
      :class="{ 'dartboard--locked': locked, 'dartboard--zoomable': zoomable }"
      :viewBox="viewBox"
      xmlns="http://www.w3.org/2000/svg"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="endGesture"
      @contextmenu.prevent
    >
      <DartboardFace :cell-class="cellClass" />
    </svg>
    <button v-if="zoomed" type="button" class="dartboard__reset" @click="resetZoom">
      <AppIcon name="zoom-out" :width="18" :height="18" />
      Dézoomer
    </button>
  </div>
</template>

<style lang="scss" scoped>
.dartboard-wrap {
  position: relative;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;

  // Grow to the largest square that fits the parent box (width *and* height).
  // Relies on the parent being a size container — see the `fill` prop.
  &--fill {
    width: min(100cqw, 100cqh);
    max-width: min(100cqw, 100cqh);
  }
}

.dartboard {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  touch-action: manipulation;
  user-select: none;
  cursor: pointer;

  &--zoomable {
    touch-action: pan-y;
  }

  &--locked {
    pointer-events: none;
    opacity: 0.6;
  }
}

.dartboard__reset {
  position: absolute;
  top: $padding-xs;
  right: $padding-xs;
  display: flex;
  align-items: center;
  gap: $gap-xxs;
  padding: $padding-xxs $padding-sm;
  border-radius: $radius-sm;
  background: $black;
  color: $white;
  @include title-sm;
  transition: opacity 0.15s;

  &:active { opacity: 0.6; }
}

.dartboard :deep(.dartboard__cell--pressed) {
  opacity: 0.6;
}

@media (min-width: $bp-laptop) {
  .dartboard-wrap:not(.dartboard-wrap--fill) {
    max-width: 520px;
  }
}
</style>
