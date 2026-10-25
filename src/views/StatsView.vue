<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import PageHeader from '../components/PageHeader.vue'
import AppTabs from '../components/AppTabs.vue'
import StatsScoreTab from '../components/stats/StatsScoreTab.vue'
import StatsWarmupTab from '../components/stats/StatsWarmupTab.vue'
import StatsX01Tab from '../components/stats/StatsX01Tab.vue'
import StatsCheckoutTab from '../components/stats/StatsCheckoutTab.vue'
import { STATS_MODES } from '../data/statsModes.js'
import StatsSessionDetail from '../components/stats/StatsSessionDetail.vue'

const router     = useRouter()
const route      = useRoute()
const dbStore    = useDbStore()
const badgeStore = useBadgeStore()

const globalStats      = ref(null)
const gameSessions     = ref([])
const warmupSessions   = ref([])
const x01Sessions      = ref([])
const checkoutSessions = ref([])
const loading          = ref(true)

onMounted(async () => {
  const [s, gs, ws, x1, co] = await Promise.all([
    dbStore.fetchGlobalStats(),
    dbStore.fetchGameSessions(10),
    dbStore.fetchWarmupSessions(10),
    dbStore.fetchX01Sessions(10),
    dbStore.fetchCheckoutSessions(10),
  ])
  globalStats.value      = s
  gameSessions.value     = gs
  warmupSessions.value   = ws
  x01Sessions.value      = x1
  checkoutSessions.value = co
  loading.value          = false
  openFromQuery()
})

const selectedMode = ref('score')

const selectedSession = ref(null)
const showDetail      = ref(false)

// ?mode=x01&session=<id> (from the last session card on the play screen) opens that session's detail
function openFromQuery() {
  const { mode, session } = route.query
  const lists = { score: gameSessions, warmup: warmupSessions, x01: x01Sessions, checkout: checkoutSessions }
  if (!mode || !session || !lists[mode]) return
  selectedMode.value = mode
  const found = lists[mode].value.find(s => s.id === session)
  if (found) openDetail(found)
}

function openDetail(session) {
  selectedSession.value = session
  showDetail.value      = true
}

function openTournament({ tournament_id: id, tournaments }) {
  const tab = tournaments.format === 'championship' ? 'matchdays' : 'bracket'
  router.push({ name: 'tournament-detail', params: { id }, query: { tab } })
}

async function deleteSession(id) {
  if (selectedMode.value === 'score') {
    await dbStore.deleteGameSession(id)
    gameSessions.value = gameSessions.value.filter(s => s.id !== id)
  } else if (selectedMode.value === 'warmup') {
    await dbStore.deleteWarmupSession(id)
    warmupSessions.value = warmupSessions.value.filter(s => s.id !== id)
  } else if (selectedMode.value === 'x01') {
    await dbStore.deleteX01Session(id)
    x01Sessions.value = x01Sessions.value.filter(s => s.id !== id)
  } else if (selectedMode.value === 'checkout') {
    await dbStore.deleteCheckoutSession(id)
    checkoutSessions.value = checkoutSessions.value.filter(s => s.id !== id)
  }
  showDetail.value = false
  const [newGlobal, profileStats] = await Promise.all([
    dbStore.fetchGlobalStats(),
    dbStore.fetchProfileStats(),
  ])
  globalStats.value = newGlobal
  await badgeStore.revokeVolumeBadges(profileStats)
}
</script>

<template>
  <div class="stats">
    <PageHeader title="Statistiques" />

    <main class="stats__main">
      <AppTabs :tabs="STATS_MODES" v-model="selectedMode" variant="chip" scrollable />

      <p v-if="loading" class="stats__empty">Chargement…</p>

      <template v-else>
        <StatsScoreTab
          v-if="selectedMode === 'score'"
          :summary="globalStats?.gameStats ?? null"
          :sessions="gameSessions"
          @open-detail="openDetail"
        />
        <StatsWarmupTab
          v-else-if="selectedMode === 'warmup'"
          :summary="globalStats?.warmupStats ?? null"
          :sessions="warmupSessions"
          @open-detail="openDetail"
          @open-chart="router.push({ name: 'stats-warmup-detail' })"
        />
        <StatsX01Tab
          v-else-if="selectedMode === 'x01'"
          :sessions="x01Sessions"
          @open-detail="openDetail"
        />
        <StatsCheckoutTab
          v-else-if="selectedMode === 'checkout'"
          :sessions="checkoutSessions"
          @open-detail="openDetail"
        />
      </template>
    </main>

    <StatsSessionDetail
      :show="showDetail"
      :session="selectedSession"
      :mode="selectedMode"
      @close="showDetail = false"
      @delete="deleteSession"
      @open-tournament="openTournament"
    />
  </div>
</template>

<style lang="scss" scoped>
.stats {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-md $padding-md 0;
    @include nav-safe-bottom;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }
}

@media (min-width: $bp-laptop) {
  .stats {
    &__main   { gap: $gap-xl; padding: $padding-xl $padding-xxl 0; @include nav-safe-bottom($padding-xl); }
    &__empty  { @include text-md; }
  }
}
</style>
