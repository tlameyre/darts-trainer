<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDbStore } from '../store/dbStore.js'
import { formatZoneLabel } from '../composables/useWarmup.js'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import SectionTitle from '../components/SectionTitle.vue'
import StatsPeriodHero from '../components/stats/StatsPeriodHero.vue'
import StatsZoneSheet from '../components/stats/StatsZoneSheet.vue'
import WarmupAccuracyChart from '../components/stats/WarmupAccuracyChart.vue'
import StatsSessionDetail from '../components/stats/StatsSessionDetail.vue'

const props = defineProps({
  mockSessions: { type: Array, default: null },
})

const isMock = computed(() => props.mockSessions !== null)

const router = useRouter()
const dbStore = useDbStore()

const allSessions = ref([])
const loading = ref(true)
const periodMode = ref('year')   // 'week' | 'month' | 'year' | 'all'
const periodOffset = ref(0)      // 0 = current period, -1 = the one before…
const showZoneSheet = ref(false)
const selectedZones = ref([])    // [`${type}-${sector}`, ...]

onMounted(async () => {
  allSessions.value = isMock.value
    ? props.mockSessions
    : await dbStore.fetchWarmupSessionsForChart()
  loading.value = false
})

const PERIOD_TABS = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
  { id: 'all', label: 'Tout' },
]

function setPeriodMode(mode) {
  periodMode.value = mode
  periodOffset.value = 0
}

// Bounds (ms) of the displayed period, null for "all"
const periodRange = computed(() => {
  const now = new Date()
  if (periodMode.value === 'week') {
    const mondayShift = (now.getDay() + 6) % 7
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayShift + periodOffset.value * 7)
    return { start: start.getTime(), end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7).getTime() - 1 }
  }
  if (periodMode.value === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + periodOffset.value, 1)
    return { start: start.getTime(), end: new Date(start.getFullYear(), start.getMonth() + 1, 1).getTime() - 1 }
  }
  if (periodMode.value === 'year') {
    const year = now.getFullYear() + periodOffset.value
    return { start: new Date(year, 0, 1).getTime(), end: new Date(year + 1, 0, 1).getTime() - 1 }
  }
  return null
})

function formatDay(time) {
  return new Date(time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const periodLabel = computed(() => {
  const range = periodRange.value
  if (!range) return null
  if (periodMode.value === 'week') return `${formatDay(range.start)} – ${formatDay(range.end)}`
  if (periodMode.value === 'month') return capitalize(new Date(range.start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
  return String(new Date(range.start).getFullYear())
})

const periodCaption = computed(() => {
  const range = periodRange.value
  if (!range) return 'toutes périodes'
  if (periodMode.value === 'week') return `semaine du ${formatDay(range.start)}`
  if (periodMode.value === 'month') return new Date(range.start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return `année ${periodLabel.value}`
})

const earliestSession = computed(() =>
  allSessions.value.length ? Math.min(...allSessions.value.map(s => new Date(s.played_at).getTime())) : null
)

const canPrev = computed(() => !!periodRange.value && earliestSession.value !== null && periodRange.value.start > earliestSession.value)
const canNext = computed(() => periodOffset.value < 0)

const periodFilteredSessions = computed(() => {
  const range = periodRange.value
  if (!range) return allSessions.value
  return allSessions.value.filter(s => {
    const t = new Date(s.played_at).getTime()
    return t >= range.start && t <= range.end
  })
})

function zoneKey(zone) {
  return `${zone.type}-${zone.sector}`
}

const TYPE_ORDER = { S: 0, D: 1, T: 2, A: 3, SB: 4, B: 5, AB: 6 }
const ZONE_COLORS = ['#047857', '#B45309', '#14110F', '#1D4ED8', '#EB6343', '#7C3AED', '#0891B2', '#C8001F']

const zoneOptions = computed(() => {
  const map = new Map()
  allSessions.value.forEach(s => {
    const recap = s.settings?.zoneRecap
    if (!Array.isArray(recap)) return
    recap.forEach(zs => {
      zs.zones.forEach(z => {
        const key = zoneKey(z)
        if (!map.has(key)) map.set(key, { key, label: formatZoneLabel(z), zone: z })
      })
    })
  })
  return [...map.values()].sort((a, b) =>
    (TYPE_ORDER[a.zone.type] ?? 9) - (TYPE_ORDER[b.zone.type] ?? 9) || (a.zone.sector ?? 0) - (b.zone.sector ?? 0)
  ).map((z, i) => ({ ...z, color: ZONE_COLORS[i % ZONE_COLORS.length] }))
})

function zoneOption(key) {
  return zoneOptions.value.find(z => z.key === key)
}

// Périodes d'une session dont la cible incluait la zone choisie (seule ou combinée à d'autres)
function matchingZoneRecap(session, key) {
  const recap = session.settings?.zoneRecap
  if (!Array.isArray(recap)) return []
  return recap.filter(zs => zs.zones.some(z => zoneKey(z) === key))
}

// Précision agrégée (pondérée par fléchettes) sur la zone choisie pour une session
function sessionZoneStats(session, key) {
  const periods = matchingZoneRecap(session, key)
  const total = periods.reduce((sum, zs) => sum + zs.total, 0)
  const hits = periods.reduce((sum, zs) => sum + zs.hits, 0)
  return { total, hits, accuracy: total > 0 ? Math.round((hits / total) * 100) : 0 }
}

// Sessions, précision moyenne (pondérée) et meilleure séance d'une zone sur la période affichée
function zoneStats(key) {
  const matching = periodFilteredSessions.value.filter(s => matchingZoneRecap(s, key).length > 0)
  const stats = matching.map(s => sessionZoneStats(s, key))
  const totalDarts = stats.reduce((acc, z) => acc + z.total, 0)
  const totalHits = stats.reduce((acc, z) => acc + z.hits, 0)
  return {
    sessions: matching.length,
    accuracy: totalDarts > 0 ? Math.round((totalHits / totalDarts) * 100) : 0,
    best: stats.length ? Math.max(...stats.map(z => z.accuracy)) : 0,
  }
}

const ZONE_CATEGORIES = [
  { id: 'simple', label: 'Simple', types: ['S'] },
  { id: 'double', label: 'Double', types: ['D'] },
  { id: 'triple', label: 'Triple', types: ['T'] },
  { id: 'other', label: 'Autres', types: ['A', 'B', 'SB', 'AB'] },
]

// Une catégorie (simple/double/triple/autres) par groupe, seulement si elle a des zones jouées
const zoneCategories = computed(() =>
  ZONE_CATEGORIES
    .map(cat => ({
      ...cat,
      zones: zoneOptions.value
        .filter(z => cat.types.includes(z.zone.type))
        .map(z => ({ key: z.key, label: z.label, color: z.color, ...zoneStats(z.key) })),
    }))
    .filter(cat => cat.zones.length > 0)
)

function toggleZone(key) {
  selectedZones.value = selectedZones.value.includes(key)
    ? selectedZones.value.filter(k => k !== key)
    : [...selectedZones.value, key]
}

function toggleCategory(cat) {
  const keys = cat.zones.map(z => z.key)
  const full = keys.every(k => selectedZones.value.includes(k))
  selectedZones.value = full
    ? selectedZones.value.filter(k => !keys.includes(k))
    : [...new Set([...selectedZones.value, ...keys])]
}

function dayKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Regroupe des sessions (déjà annotées displayAccuracy/secondaryAccuracy) en points, un par jour
// (moyenne des moyennes de précision des sessions du même jour).
function groupByDay(sessions) {
  const groups = new Map()
  sessions.forEach(s => {
    const key = dayKey(s.played_at)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s)
  })
  return [...groups.values()].map(group => ({
    id: dayKey(group[0].played_at),
    played_at: group[0].played_at,
    accuracy: Math.round(group.reduce((acc, s) => acc + s.displayAccuracy, 0) / group.length),
    secondaryAccuracy: null,
    sessions: group,
  }))
}

// Une courbe par zone sélectionnée ; sans sélection, une seule courbe "Toutes zones".
const chartSeries = computed(() => {
  const base = periodFilteredSessions.value

  if (!selectedZones.value.length) {
    const withDisplay = base.map(s => ({ ...s, displayAccuracy: Number(s.accuracy), secondaryAccuracy: null }))
    return [{ key: 'all', label: 'Toutes zones', color: '#1D4ED8', points: groupByDay(withDisplay) }]
  }

  return selectedZones.value.map(key => {
    const matching = base.filter(s => matchingZoneRecap(s, key).length > 0)
    const withDisplay = matching.map(s => ({
      ...s,
      displayAccuracy: sessionZoneStats(s, key).accuracy,
      secondaryAccuracy: Number(s.accuracy),
    }))
    const zoneOpt = zoneOption(key)
    return { key, label: zoneOpt?.label ?? key, color: zoneOpt?.color ?? '#1D4ED8', points: groupByDay(withDisplay) }
  })
})

const hasChartData = computed(() => chartSeries.value.some(s => s.points.length > 0))

const selectedZoneOptions = computed(() => selectedZones.value.map(zoneOption).filter(Boolean))

const selectedSession = ref(null)
const showDetail = ref(false)

function openSession(session) {
  selectedSession.value = session
  showDetail.value = true
}

async function deleteSession(id) {
  if (!isMock.value) await dbStore.deleteWarmupSession(id)
  allSessions.value = allSessions.value.filter(s => s.id !== id)
  showDetail.value = false
}

const periodSummary = computed(() => {
  const s = periodFilteredSessions.value
  if (!s.length) return { sessions: 0, avgAccuracy: '–', best: '–' }
  return {
    sessions: s.length,
    avgAccuracy: Math.round(s.reduce((acc, r) => acc + Number(r.accuracy), 0) / s.length),
    best: `${Math.max(...s.map(r => Number(r.accuracy)))} %`,
  }
})

// Un résumé par zone sélectionnée, pour coller à ce qui est affiché sur le graphique
const zoneSummaries = computed(() => selectedZoneOptions.value.map(z => ({
  key: z.key,
  label: z.label,
  color: z.color,
  ...zoneStats(z.key),
})))
</script>

<template>
  <div class="warmup-detail">
    <AppHeader title="Échauffement" tone="blue" @back="router.back()" />

    <StatsPeriodHero
      :tabs="PERIOD_TABS" :mode="periodMode" :label="periodLabel"
      :can-prev="canPrev" :can-next="canNext"
      :accuracy="periodSummary.avgAccuracy" :sessions="periodSummary.sessions" :best="periodSummary.best"
      @update:mode="setPeriodMode" @prev="periodOffset--" @next="periodOffset++"
    />

    <p v-if="loading" class="warmup-detail__empty">Chargement…</p>

    <main v-else-if="allSessions.length" class="warmup-detail__main">
      <button v-if="zoneCategories.length" class="warmup-detail__zone-btn" aria-haspopup="dialog"
        @click="showZoneSheet = true">
        <span class="warmup-detail__zone-btn-text">
          <span class="warmup-detail__zone-btn-label">
            Zones affichées · {{ selectedZones.length || 'toutes' }}
          </span>
          <span v-if="selectedZoneOptions.length" class="warmup-detail__zone-tags">
            <span v-for="z in selectedZoneOptions" :key="z.key" class="warmup-detail__zone-tag">
              <span class="warmup-detail__dot" :style="{ background: z.color }" />
              {{ z.label }}
            </span>
          </span>
        </span>
        <span class="warmup-detail__zone-btn-action">
          <AppIcon name="sliders" :width="18" :height="18" />
          Filtrer
        </span>
      </button>

      <section class="warmup-detail__chart">
        <SectionTitle title="Précision par zone" :count="periodCaption" ruled />
        <WarmupAccuracyChart
          v-if="hasChartData"
          :series="chartSeries" :mode="periodMode" :range="periodRange"
          @open-session="openSession"
        />
        <p v-else class="warmup-detail__empty">Aucune session d'échauffement pour cette période.</p>
      </section>

      <section v-if="zoneSummaries.length" class="warmup-detail__summaries">
        <SectionTitle title="Résumé par zone" ruled />
        <article v-for="zs in zoneSummaries" :key="zs.key" class="warmup-detail__summary">
          <div class="warmup-detail__summary-head">
            <span class="warmup-detail__summary-label">
              <span class="warmup-detail__dot warmup-detail__dot--lg" :style="{ background: zs.color }" />
              {{ zs.label }}
            </span>
            <span class="warmup-detail__bar">
              <span class="warmup-detail__bar-fill" :style="{ width: zs.accuracy + '%', background: zs.color }" />
            </span>
          </div>
          <div class="warmup-detail__stats">
            <span class="warmup-detail__stat">
              <span class="warmup-detail__stat-label">Sessions</span>
              <span class="warmup-detail__stat-value">{{ zs.sessions }}</span>
            </span>
            <span class="warmup-detail__stat">
              <span class="warmup-detail__stat-label">Précision moy.</span>
              <span class="warmup-detail__stat-value">{{ zs.accuracy }}<small class="warmup-detail__stat-unit"> %</small></span>
            </span>
            <span class="warmup-detail__stat">
              <span class="warmup-detail__stat-label">Meilleure</span>
              <span class="warmup-detail__stat-value">{{ zs.best }}<small class="warmup-detail__stat-unit"> %</small></span>
            </span>
          </div>
        </article>
      </section>
    </main>

    <p v-else class="warmup-detail__empty">Lance une session d'échauffement pour voir tes stats ici.</p>

    <StatsZoneSheet
      :show="showZoneSheet"
      :categories="zoneCategories" :selected="selectedZones"
      @close="showZoneSheet = false"
      @toggle="toggleZone"
      @toggle-category="toggleCategory"
      @clear="selectedZones = []"
    />

    <StatsSessionDetail
      :show="showDetail"
      :session="selectedSession"
      mode="warmup"
      @close="showDetail = false"
      @delete="deleteSession"
    />
  </div>
</template>

<style lang="scss" scoped>
.warmup-detail {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    display: grid;
    gap: $gap-lg;
    grid-template-areas: 'btn' 'chart' 'sum';
    padding: $padding-md $padding-md 0;
    @include nav-safe-bottom;
  }

  &__zone-btn {
    grid-area: btn;
    display: flex;
    align-items: center;
    gap: $gap-sm;
    min-height: 52px;
    padding: $padding-xs $padding-xs $padding-xs $padding-sm;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    background: $bg;
    color: $text-color;
    text-align: left;
  }

  &__zone-btn-text {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  &__zone-btn-label {
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    color: $muted;
  }

  &__zone-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__zone-tag {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: $surface;
    @include title-sm;
    line-height: 1;
    text-transform: uppercase;
  }

  &__zone-btn-action {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    padding: 0 $padding-sm;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
    @include title-sm;
    text-transform: uppercase;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-xs;
    flex-shrink: 0;

    &--lg {
      width: 12px;
      height: 12px;
    }
  }

  &__chart {
    grid-area: chart;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    min-width: 0;
  }

  &__summaries {
    grid-area: sum;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__summary {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__summary-head {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__summary-label {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    flex-shrink: 0;
    min-width: 64px;
    @include title-xl;
    line-height: 1;
    text-transform: uppercase;
  }

  &__bar {
    flex: 1;
    height: 8px;
    border-radius: $radius-xs;
    background: $border-color;
    overflow: hidden;
  }

  &__bar-fill {
    display: block;
    height: 100%;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    min-width: 0;
  }

  &__stat-label {
    @include text-xxs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    color: $muted;
  }

  &__stat-value {
    @include title-xxl;
    line-height: 0.95;
    text-transform: uppercase;
  }

  &__stat-unit {
    @include title-sm;
    font-size: 14px;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }
}

@media (min-width: $bp-laptop) {
  .warmup-detail {
    &__main {
      grid-template-columns: minmax(0, 832px) minmax(0, 1fr);
      grid-template-rows: auto 1fr;
      grid-template-areas: 'chart btn' 'chart sum';
      align-items: start;
      column-gap: $gap-xxl + $gap-xs;
      padding: $padding-xl $padding-xxl 0;
      @include nav-safe-bottom($padding-xl);
    }

    &__zone-btn {
      min-height: 60px;
      padding: $padding-xs $padding-xs $padding-xs $padding-md;
    }

    &__zone-btn-label { @include text-xs; }
    &__zone-tag { @include title-md; }
    &__zone-btn-action { @include title-md; height: 44px; padding: 0 $padding-md; }
    &__summary { padding: $padding-sm $padding-md; }
    &__summary-label { @include title-xl; font-size: 24px; min-width: 72px; }
    &__empty { @include text-md; }
  }
}
</style>
