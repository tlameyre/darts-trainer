<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

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

const chartSeries = computed(() =>
  props.series.map(s => ({
    name: s.label,
    data: s.points.map(pt => ({ x: new Date(pt.played_at).getTime(), y: pt.accuracy })),
  }))
)

const allPoints = computed(() => props.series.flatMap(s => s.points))

const xBounds = computed(() => {
  if (props.range) return { min: props.range.start, max: props.range.end }
  const times = allPoints.value.map(pt => new Date(pt.played_at).getTime())
  if (!times.length) return {}
  const min = Math.min(...times)
  const max = Math.max(...times)
  // A single day would collapse the axis: pad one day each side
  return min === max ? { min: min - 86400000, max: max + 86400000 } : { min, max }
})

const X_TICKS = {
  week: { amount: 7, format: 'dd/MM' },
  month: { amount: 4, format: 'dd/MM' },
  year: { amount: 11, format: 'MMM' },
  all: { amount: 5, format: 'MMM yy' },
}

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
      <span class="chart-tip__sub">${count} session${count > 1 ? 's' : ''} · touche pour ouvrir</span>
      ${overall}
    </div>`
}

const chartOptions = computed(() => {
  const ticks = X_TICKS[props.periodMode] ?? X_TICKS.all
  const labelStyle = { colors: MUTED, fontSize: isWide.value ? '13px' : '11px', fontFamily: 'Barlow' }
  return {
    chart: {
      id: 'darts-accuracy-chart',
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
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
        dataPointSelection: (_event, _ctx, { seriesIndex, dataPointIndex }) => {
          const sessions = props.series[seriesIndex]?.points[dataPointIndex]?.sessions
          if (sessions?.length) emit('open-session', sessions[sessions.length - 1])
        },
      },
    },
    colors: props.series.map(s => s.color || FALLBACK_COLOR),
    stroke: { curve: 'straight', width: 3, lineCap: 'round' },
    markers: { size: isWide.value ? 6 : 5, strokeWidth: 2, strokeColors: '#F2EFE6', hover: { sizeOffset: 3 } },
    grid: { borderColor: GRID, strokeDashArray: 3, padding: { left: 4, right: 12 } },
    legend: { show: props.series.length > 1, position: 'top', horizontalAlign: 'left', labels: { colors: INK }, markers: { size: 6 } },
    xaxis: {
      type: 'datetime',
      ...xBounds.value,
      tickAmount: ticks.amount,
      tooltip: { enabled: false },
      axisBorder: { color: GRID },
      axisTicks: { color: GRID },
      labels: {
        hideOverlappingLabels: true,
        style: labelStyle,
        datetimeUTC: false,
        datetimeFormatter: { year: 'yyyy', month: ticks.format, day: ticks.format, hour: ticks.format },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 4,
      labels: { style: labelStyle, formatter: val => `${Math.round(val)}%` },
    },
    annotations: averageLine.value === null ? {} : {
      yaxis: [{
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
  <div class="accuracy-chart" role="img" aria-label="Évolution de la précision d'échauffement">
    <apexchart type="line" :height="isWide ? 360 : 260" :options="chartOptions" :series="chartSeries" />
  </div>
</template>

<style lang="scss" scoped>
.accuracy-chart {
  width: 100%;
  min-width: 0;

  :deep(.apexcharts-marker) { cursor: pointer; }

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
