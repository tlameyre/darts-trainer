<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import IconButton from '../IconButton.vue'

const props = defineProps({
  series: { type: Array, default: () => [] },
  periodMode: { type: String, default: 'year' },
  range: { type: Object, default: null },
})

const emit = defineEmits(['open-session'])

const FALLBACK_COLOR = '#1D4ED8'
const INK = '#14110F'
const MUTED = '#5F594F'
const GRID = '#D6CFBF'

const isWide = ref(false)
let mq = null
const syncWidth = () => { isWide.value = mq.matches }

onMounted(() => {
  mq = window.matchMedia('(min-width: 1025px)')
  syncWidth()
  mq.addEventListener('change', syncWidth)
})
onUnmounted(() => mq?.removeEventListener('change', syncWidth))

// Points are daily aggregates: pin them to local midnight so they sit on the day ticks
function dayStart(iso) {
  const d = new Date(iso)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const chartSeries = computed(() =>
  props.series.map(s => ({
    name: s.label,
    data: s.points.map(pt => ({ x: dayStart(pt.played_at), y: pt.accuracy })),
  }))
)

const picked = ref(null)
const chartRef = ref(null)
const zoomed = ref(false)

watch(() => [props.series, props.periodMode, props.range], () => {
  picked.value = null
  zoomed.value = false
})

function resetZoom() {
  chartRef.value?.zoomX(xBounds.value.min, xBounds.value.max)
  zoomed.value = false
}

function openSession(session) {
  picked.value = null
  emit('open-session', session)
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const allPoints = computed(() => props.series.flatMap(s => s.points))

const xBounds = computed(() => {
  if (props.range) return { min: props.range.start, max: props.range.end }
  const times = allPoints.value.map(pt => dayStart(pt.played_at))
  if (!times.length) return {}
  const min = Math.min(...times)
  const max = Math.max(...times)
  // A single day would collapse the axis: pad one day each side
  return min === max ? { min: min - 86400000, max: max + 86400000 } : { min, max }
})

const X_TICKS = { week: 7, month: 4, year: 11, all: 5 }

const averageLine = computed(() => {
  if (props.series.length !== 1 || !props.series[0].points.length) return null
  const pts = props.series[0].points
  return Math.round(pts.reduce((acc, pt) => acc + pt.accuracy, 0) / pts.length)
})

function formatDate(time) {
  return new Date(time).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function tooltipHtml({ seriesIndex, dataPointIndex }) {
  const serie = props.series[seriesIndex]
  const pt = serie?.points[dataPointIndex]
  if (!pt) return ''
  const count = pt.sessions.length
  const overall = pt.sessions[0]?.secondaryAccuracy != null && count === 1
    ? `<span class="chart-tip__sub">Précision globale · ${pt.sessions[0].secondaryAccuracy} %</span>`
    : ''
  return `
    <div class="chart-tip">
      <span class="chart-tip__date">${formatDate(pt.played_at)}</span>
      <span class="chart-tip__row">
        <i class="chart-tip__dot" style="background:${serie.color || FALLBACK_COLOR}"></i>
        <b>${serie.label}</b>
        <span class="chart-tip__value">${pt.accuracy} %</span>
      </span>
      <span class="chart-tip__sub">${count} session${count > 1 ? 's' : ''} · touche pour ${count > 1 ? 'choisir' : 'ouvrir'}</span>
      ${overall}
    </div>`
}

const chartOptions = computed(() => {
    const labelStyle = { colors: MUTED, fontSize: isWide.value ? '13px' : '11px', fontFamily: 'Barlow' }
  return {
    chart: {
      id: 'darts-accuracy-chart',
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: true, type: 'x', allowMouseWheelZoom: false },
      fontFamily: 'Barlow',
      foreColor: MUTED,
      animations: { enabled: true, speed: 350 },
      locales: [{
        name: 'fr',
        options: {
          months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
          shortMonths: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
          days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
          shortDays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
        },
      }],
      defaultLocale: 'fr',
      events: {
        zoomed: () => { zoomed.value = true; picked.value = null },
        dataPointSelection: (_event, _ctx, { seriesIndex, dataPointIndex }) => {
          const serie = props.series[seriesIndex]
          const sessions = serie?.points[dataPointIndex]?.sessions
          if (!sessions?.length) return
          if (sessions.length === 1) return openSession(sessions[0])
          picked.value = { date: serie.points[dataPointIndex].played_at, label: serie.label, sessions }
        },
      },
    },
    colors: props.series.map(s => s.color || FALLBACK_COLOR),
    stroke: { curve: 'monotoneCubic', width: 3, lineCap: 'round' },
    markers: { size: isWide.value ? 6 : 5, strokeWidth: 2, strokeColors: '#F2EFE6', hover: { sizeOffset: 3 } },
    grid: { borderColor: GRID, strokeDashArray: 3, padding: { top: 28, left: 4, right: 12 } },
    legend: { show: props.series.length > 1, position: 'top', horizontalAlign: 'left', labels: { colors: INK }, markers: { size: 6 } },
    xaxis: {
      type: 'datetime',
      ...xBounds.value,
      tickAmount: X_TICKS[props.periodMode] ?? X_TICKS.all,
      tooltip: { enabled: false },
      axisBorder: { color: GRID },
      axisTicks: { color: GRID },
      labels: {
        hideOverlappingLabels: true,
        style: labelStyle,
        datetimeUTC: false,
        formatter: (_value, timestamp, opts) => {
          const { minX, maxX } = opts.w.globals
          const date = new Date(timestamp)
          if (maxX - minX <= 150 * 86400000) {
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          }
          const month = date.toLocaleDateString('fr-FR', { month: 'short' })
          return props.periodMode === 'all' ? `${month} ${String(date.getFullYear()).slice(2)}` : month
        },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: { style: labelStyle, formatter: val => `${Math.round(val)}%` },
    },
    annotations: {
      yaxis: averageLine.value === null ? [] : [{
        y: averageLine.value,
        borderColor: INK,
        strokeDashArray: 4,
        opacity: 0.5,
        label: {
          text: `Moy. ${averageLine.value}%`,
          position: 'left',
          textAnchor: 'start',
          offsetY: -4,
          borderWidth: 0,
          style: { color: INK, background: 'transparent', fontSize: '11px', fontFamily: 'Barlow' },
        },
      }],
    },
    tooltip: { shared: false, intersect: true, custom: tooltipHtml },
  }
})
</script>

<template>
  <div class="accuracy-chart" role="img" @dblclick="zoomed && resetZoom()" aria-label="Évolution de la précision d'échauffement">
    <div v-if="zoomed" class="accuracy-chart__zoom">
      <IconButton variant="outline" size="sm" icon="zoom-out" label="Réinitialiser le zoom" @click="resetZoom" />
    </div>
    <apexchart ref="chartRef" type="line" :height="isWide ? 360 : 260" :options="chartOptions" :series="chartSeries" />

    <div v-if="picked" class="accuracy-chart__picker">
      <div class="accuracy-chart__picker-head">
        <span class="accuracy-chart__picker-title">{{ formatDate(picked.date) }} · {{ picked.label }}</span>
        <IconButton variant="bare" icon="close" label="Fermer" @click="picked = null" />
      </div>
      <button v-for="s in picked.sessions" :key="s.id" class="accuracy-chart__session" @click="openSession(s)">
        <span class="accuracy-chart__session-time">{{ formatTime(s.played_at) }}</span>
        <span class="accuracy-chart__session-value">{{ s.displayAccuracy }} %</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.accuracy-chart {
  position: relative;
  width: 100%;
  min-width: 0;

  :deep(.apexcharts-marker) { cursor: pointer; }
  :deep(.apexcharts-toolbar) { display: none; }

  &__zoom {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }

  &__picker {
    display: flex;
    flex-direction: column;
    margin-top: $padding-sm;
    border: $border-sm solid $border-color;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__picker-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $padding-xs $padding-md;
    gap: $gap-sm;
    @include text-sm;
  }

  &__picker-title::first-letter { text-transform: uppercase; }

  &__session {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $padding-sm $padding-md;
    border-top: $border-sm solid $border-color;
    color: $text-color;
    @include text-md;

    &-value { @include title-sm; }
  }

  :deep(.apexcharts-tooltip) {
    border: $border-sm solid $border-color;
    border-radius: $radius-sm;
    background: $bg;
    box-shadow: none;
  }
}

:global(.chart-tip) {
  display: flex;
  flex-direction: column;
  padding: $padding-sm $padding-md;
  gap: $gap-xxs;
  color: $text-color;
  @include text-sm;
}

:global(.chart-tip__date) {
  color: $muted;
  &::first-letter { text-transform: uppercase; }
  @include text-xs;
}

:global(.chart-tip__row) {
  display: flex;
  align-items: center;
  gap: $gap-xs;
}

:global(.chart-tip__dot) {
  width: 8px;
  height: 8px;
  border-radius: $radius-pill;
}

:global(.chart-tip__value) {
  margin-left: auto;
  padding-left: $padding-md;
  @include title-sm;
}

:global(.chart-tip__sub) {
  color: $muted;
  @include text-xs;
}
</style>
