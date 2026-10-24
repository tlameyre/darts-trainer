<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  // [{ key, label, color, points: [{ id, played_at, accuracy, secondaryAccuracy?, sessions: [...] }] }]
  // `points` triés par played_at ascendant ; `sessions` liste les séances brutes derrière un point
  // (plusieurs si regroupées sur un même jour).
  series: { type: Array, default: () => [] },
  // Période affichée : règle le type de graduations ; l'axe X va toujours de la 1re à la dernière séance
  mode:   { type: String, default: 'year' },
})

const emit = defineEmits(['open-session'])

// Mêmes valeurs que $bp-laptop : le graphique change de taille de viewBox sur grand écran
const LAPTOP_QUERY = '(min-width: 1025px)'
const isWide = ref(false)
let mql = null
const onMql = e => { isWide.value = e.matches }

onMounted(() => {
  mql = window.matchMedia(LAPTOP_QUERY)
  isWide.value = mql.matches
  mql.addEventListener('change', onMql)
  document.addEventListener('click', handleDocumentClick, true)
})
onUnmounted(() => {
  mql?.removeEventListener('change', onMql)
  document.removeEventListener('click', handleDocumentClick, true)
})

const dims = computed(() => isWide.value
  ? { w: 800, h: 530, left: 40, right: 12, top: 12, bottom: 34, font: 12, popW: 300 }
  : { w: 342, h: 220, left: 30, right: 10, top: 10, bottom: 24, font: 10, popW: 290 })

const plotLeft = computed(() => dims.value.left)
const plotRight = computed(() => dims.value.w - dims.value.right)
const plotTop = computed(() => dims.value.top)
const baseline = computed(() => dims.value.h - dims.value.bottom)

const activeCoord = ref(null) // { x, y } en unités du viewBox, ou null
const COINCIDENCE_TOLERANCE = 5 // points considérés "au même endroit" en dessous de cette distance

const allRawPoints = computed(() => props.series.flatMap(s => s.points))
const times = computed(() => allRawPoints.value.map(p => new Date(p.played_at).getTime()))

// La 1re séance est à l'origine : pas d'espace vide si la période n'est que partiellement remplie
const domain = computed(() => {
  if (!times.value.length) return { start: 0, end: 1 }
  return { start: Math.min(...times.value), end: Math.max(...times.value) }
})

function xFor(time) {
  const left = plotLeft.value
  const right = plotRight.value
  const { start, end } = domain.value
  if (end === start) return left + (right - left) / 2
  return left + ((time - start) / (end - start)) * (right - left)
}

const yMax = computed(() => {
  const max = Math.max(...allRawPoints.value.map(p => Number(p.accuracy)), 0)
  const step = max <= 50 ? 10 : 20
  return Math.min(100, Math.max(step * 2, Math.ceil((max + 1) / step) * step))
})

const yStep = computed(() => (yMax.value <= 50 ? 10 : 20))

const yTicks = computed(() => {
  const ticks = []
  for (let v = 0; v <= yMax.value; v += yStep.value) ticks.push(v)
  return ticks
})

function yFor(accuracy) {
  return baseline.value - (Number(accuracy) / yMax.value) * (baseline.value - plotTop.value)
}

function startOfDay(time) {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function addDays(time, n) {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime()
}

function startOfMonth(time) {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

function addMonths(time, n) {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime()
}

// Graduations majeures (trait long + label) et mineures (trait court), selon la période affichée
const ticks = computed(() => {
  const { start, end } = domain.value
  const major = []
  const minor = []

  if (props.mode === 'week') {
    for (let t = startOfDay(start); t <= end; t = addDays(t, 1)) {
      major.push({ time: t, label: new Date(t).toLocaleDateString('fr-FR', { weekday: 'short' }) })
    }
  } else if (props.mode === 'month') {
    for (let t = startOfDay(start); t <= end; t = addDays(t, 1)) {
      const day = new Date(t).getDate()
      if ((day - 1) % 7 === 0) {
        major.push({ time: t, label: new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) })
      } else {
        minor.push(t)
      }
    }
  } else {
    // 'year' et 'all' : un début de mois = trait long, quarts de mois = traits courts
    let cur = startOfMonth(start)
    if (cur < start) cur = addMonths(cur, 1)
    const spanMonths = (end - start) / (30 * 86400000)
    for (; cur <= end; cur = addMonths(cur, 1)) {
      const d = new Date(cur)
      const isJan = d.getMonth() === 0
      if (spanMonths <= 14 || isJan) {
        const label = spanMonths <= 14
          ? d.toLocaleDateString('fr-FR', { month: 'short' })
          : String(d.getFullYear())
        major.push({ time: cur, label })
      }
      if (spanMonths <= 14) {
        const next = addMonths(cur, 1)
        for (let i = 1; i <= 3; i++) {
          const t = cur + (i * (next - cur)) / 4
          if (t <= end) minor.push(t)
        }
      }
    }
  }
  const inDomain = t => t >= start && t <= end
  return { major: major.filter(t => inDomain(t.time)), minor: minor.filter(inDomain) }
})

// Évite un label coupé par le bord droit quand la dernière graduation est trop proche
function labelFits(tick) {
  return xFor(tick.time) + 3 + tick.label.length * dims.value.font * 0.6 <= dims.value.w
}

const renderedSeries = computed(() =>
  props.series.map(s => {
    const points = s.points.map((p, i) => ({
      id: p.id ?? i,
      x: xFor(new Date(p.played_at).getTime()),
      y: yFor(p.accuracy),
      accuracy: Number(p.accuracy),
      secondaryAccuracy: p.secondaryAccuracy != null ? Number(p.secondaryAccuracy) : null,
      playedAt: p.played_at,
      sessions: p.sessions ?? [],
    }))
    return {
      key: s.key,
      label: s.label,
      color: s.color,
      points,
      path: points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(''),
    }
  })
)

function formatDay(iso) {
  const label = new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function isCoincident(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) <= COINCIDENCE_TOLERANCE
}

function handlePointClick(point) {
  activeCoord.value = activeCoord.value && isCoincident(activeCoord.value, point)
    ? null
    : { x: point.x, y: point.y }
}

function openSession(session) {
  activeCoord.value = null
  emit('open-session', session)
}

// Toutes les courbes ayant un point au même endroit (à la tolérance près) que le point actif
const activeGroup = computed(() => {
  if (!activeCoord.value) return []
  const group = []
  for (const s of renderedSeries.value) {
    for (const p of s.points) {
      if (isCoincident(activeCoord.value, p)) {
        group.push({ seriesKey: s.key, seriesLabel: s.label, seriesColor: s.color, point: p })
      }
    }
  }
  return group
})

// Sessions uniques du groupe actif — une session présente dans plusieurs courbes (même période
// combinant plusieurs zones) n'apparaît qu'une fois, avec une pastille de couleur par courbe.
const mergedSessionRows = computed(() => {
  const map = new Map()
  for (const g of activeGroup.value) {
    for (const sess of g.point.sessions) {
      if (!map.has(sess.id)) {
        map.set(sess.id, {
          id: sess.id,
          playedAt: sess.played_at,
          secondaryAccuracy: sess.secondaryAccuracy,
          raw: sess,
          values: [],
        })
      }
      map.get(sess.id).values.push({ color: g.seriesColor, accuracy: sess.displayAccuracy })
    }
  }
  return [...map.values()].sort((a, b) => new Date(a.playedAt) - new Date(b.playedAt))
})

const plotEl = ref(null)

// Bulle sous le point actif, recadrée dans le graphique ; la flèche reste alignée sur le point
const popoverPos = computed(() => {
  if (!activeCoord.value || !plotEl.value) return null
  const scale = plotEl.value.clientWidth / dims.value.w
  const x = activeCoord.value.x * scale
  const y = activeCoord.value.y * scale
  const width = dims.value.popW
  const left = Math.min(Math.max(x - width / 2, 4), plotEl.value.clientWidth - width - 4)
  return { left, top: y + 14, arrow: x - left - 7, width }
})

function handleDocumentClick(event) {
  if (!activeCoord.value) return
  if (event.target.closest('.chart__popover, .chart__point')) return
  activeCoord.value = null
}
</script>

<template>
  <div class="chart">
    <div class="chart__box">
      <div ref="plotEl" class="chart__plot">
        <svg class="chart__svg" :viewBox="`0 0 ${dims.w} ${dims.h}`" role="img" aria-label="Précision par zone">
          <g v-for="v in yTicks" :key="v">
            <line :x1="plotLeft" :x2="plotRight" :y1="yFor(v)" :y2="yFor(v)" class="chart__gridline" />
            <text
              :x="plotLeft - 6" :y="yFor(v) + dims.font * 0.35" text-anchor="end"
              class="chart__axis-label" :font-size="dims.font"
            >{{ v }}%</text>
          </g>

          <line
            v-for="t in ticks.minor" :key="`n-${t}`"
            :x1="xFor(t)" :x2="xFor(t)" :y1="baseline" :y2="baseline + 3"
            class="chart__tick--minor"
          />
          <g v-for="t in ticks.major" :key="`j-${t.time}`">
            <line :x1="xFor(t.time)" :x2="xFor(t.time)" :y1="baseline" :y2="baseline + 6" class="chart__tick--major" />
            <text
              v-if="labelFits(t)"
              :x="xFor(t.time) + 3" :y="baseline + 6 + dims.font + 1"
              class="chart__axis-label chart__axis-label--x" :font-size="dims.font"
            >{{ t.label }}</text>
          </g>

          <line :x1="plotLeft" :x2="plotRight" :y1="baseline" :y2="baseline" class="chart__baseline" />

          <template v-for="s in renderedSeries" :key="s.key">
            <path v-if="s.points.length > 1" :d="s.path" class="chart__line" :stroke="s.color" />
            <g v-for="p in s.points" :key="p.id" class="chart__point" @click="handlePointClick(p)">
              <circle
                v-if="activeCoord && isCoincident(activeCoord, p)"
                :cx="p.x" :cy="p.y" r="9" :fill="s.color" opacity="0.22"
              />
              <circle
                :cx="p.x" :cy="p.y"
                :r="activeCoord && isCoincident(activeCoord, p) ? 5.5 : 4"
                :fill="s.color" class="chart__dot"
              />
            </g>
          </template>
        </svg>

        <div
          v-if="activeGroup.length && popoverPos"
          class="chart__popover"
          role="dialog"
          :style="{ left: popoverPos.left + 'px', top: popoverPos.top + 'px', width: popoverPos.width + 'px' }"
        >
          <span class="chart__popover-arrow" aria-hidden="true" :style="{ left: popoverPos.arrow + 'px' }" />
          <span class="chart__popover-date">{{ formatDay(activeGroup[0].point.playedAt) }}</span>

          <button
            v-for="row in mergedSessionRows" :key="row.id"
            class="chart__popover-row"
            @click="openSession(row.raw)"
          >
            <span class="chart__popover-time">{{ formatTime(row.playedAt) }}</span>
            <span class="chart__popover-dots">
              <span v-for="(v, i) in row.values" :key="i" class="chart__popover-dot" :style="{ background: v.color }" />
            </span>
            <span class="chart__popover-value">{{ row.values[0].accuracy }} %</span>
            <span v-if="row.secondaryAccuracy !== null" class="chart__popover-secondary">
              (session : {{ row.secondaryAccuracy }} %)
            </span>
            <AppIcon name="angle-down" :width="18" :height="18" class="chart__popover-chevron" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="series.length > 1" class="chart__legend">
      <span v-for="s in series" :key="s.key" class="chart__legend-item">
        <span class="chart__legend-swatch" :style="{ background: s.color }" />
        {{ s.label }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  width: 100%;

  &__box {
    padding-top: $padding-xs;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__plot {
    position: relative;
  }

  &__svg {
    display: block;
    width: 100%;
    height: auto;
  }

  &__gridline {
    stroke: $border-color;
    stroke-width: 1;
  }

  &__baseline {
    stroke: $black;
    stroke-width: 1;
  }

  &__tick--minor {
    stroke: $muted;
    stroke-width: 1;
  }

  &__tick--major {
    stroke: $black;
    stroke-width: 1.5;
  }

  &__axis-label {
    fill: $muted;
    font-weight: 500;

    &--x {
      fill: $black;
      font-weight: 600;
    }
  }

  &__line {
    fill: none;
    stroke-width: 2.5;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  &__point { cursor: pointer; }

  &__dot {
    stroke: $surface;
    stroke-width: 2;
  }

  &__popover {
    position: absolute;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    box-sizing: border-box;
    padding: $padding-xs;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    background: $white;
    box-shadow: 0 6px 18px rgba($black, 0.22);
  }

  &__popover-arrow {
    position: absolute;
    top: -9px;
    width: 14px;
    height: 14px;
    background: $white;
    border-left: $border-md solid $black;
    border-top: $border-md solid $black;
    transform: rotate(45deg);
  }

  &__popover-date {
    @include title-md;
    line-height: 1;
  }

  &__popover-row {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-xs;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;
    text-align: left;
    white-space: nowrap;
  }

  &__popover-time {
    width: 38px;
    @include text-sm;
    font-weight: 600;
    color: $muted;
  }

  &__popover-dots {
    display: flex;
    gap: 3px;
  }

  &__popover-dot {
    width: 10px;
    height: 10px;
    border-radius: $radius-xs;
  }

  &__popover-value {
    @include title-lg;
    line-height: 1;
  }

  &__popover-secondary {
    @include text-xs;
    color: $muted;
  }

  &__popover-chevron {
    margin-left: auto;
    transform: rotate(-90deg);
  }

  &__legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: $gap-xxs $gap-md;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include title-sm;
    text-transform: uppercase;
  }

  &__legend-swatch {
    width: 16px;
    height: 4px;
    border-radius: $radius-xs;
  }
}

@media (min-width: $bp-laptop) {
  .chart {
    &__box { padding: $padding-sm $padding-md $padding-xxs; }
    &__popover { padding: $padding-sm; }
    &__popover-date { @include title-lg; }
    &__popover-time { @include text-md; }
    &__popover-value { @include title-xl; }
    &__popover-secondary { @include text-sm; }
    &__legend { gap: $gap-xxs $gap-lg; }
    &__legend-item { @include title-md; }
    &__legend-swatch { width: 18px; }
  }
}
</style>
