<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import { useWarmup, formatZonesLabel } from '../composables/useWarmup.js'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import GameLayout from '../components/game/GameLayout.vue'
import GameHeaderButton from '../components/game/GameHeaderButton.vue'
import GameStatusBar from '../components/game/GameStatusBar.vue'
import GameStreakBadge from '../components/game/GameStreakBadge.vue'
import WarmupHero from '../components/warmup/WarmupHero.vue'
import WarmupThrowPad from '../components/warmup/WarmupThrowPad.vue'
import WarmupZoneSheet from '../components/warmup/WarmupZoneSheet.vue'
import WarmupEndRecap from '../components/warmup/WarmupEndRecap.vue'

const router     = useRouter()
const gameStore  = useGameStore()
const dbStore    = useDbStore()
const badgeStore = useBadgeStore()

if (!gameStore.gameSettings) router.replace({ name: 'warmup-settings' })

const {
  timeDisplay, isUnlimited, isUrgent, gameOver,
  currentZones, currentZoneStats, currentStreak, zoneRecapStats, sessionStats, totalDurationMs,
  darts, recordDart, undoLast, changeZones, startTimer, pauseTimer, resumeTimer, endSession, cleanup,
} = useWarmup(gameStore.gameSettings ?? { duration: 5, zones: [{ sector: 20, type: 'D' }] })

watch(gameOver, async (val) => {
  if (val) {
    const { zones: _zones, ...restSettings } = gameStore.gameSettings
    await dbStore.saveWarmupSession({
      zones: currentZones.value,
      totalDarts: sessionStats.value.total,
      hits: sessionStats.value.hits,
      durationS: Math.round(totalDurationMs.value / 1000),
      settings: {
        ...restSettings,
        zoneRecap: zoneRecapStats.value,  // toutes les zones pour l'historique
        points: sessionStats.value.points,
        bestStreak: sessionStats.value.bestStreak,
      },
    })
    const stats = await dbStore.fetchProfileStats()
    newBadges.value = await badgeStore.checkWarmupBadges({
      totalDarts: sessionStats.value.total,
      accuracy: sessionStats.value.accuracy,
      cumulativeStats: stats,
    })
  }
})

const showZoneSheet = ref(false)
const newBadges     = ref([])

// A zone change asked mid-volley waits for the volley to end
const pendingZones = ref(null)
const midVolley    = computed(() => darts.value.length % 3 !== 0)

function openZoneSheet() {
  pauseTimer()
  showZoneSheet.value = true
}

function closeZoneSheet() {
  showZoneSheet.value = false
  resumeTimer()
}

function onZoneChange(zones) {
  if (midVolley.value) pendingZones.value = zones
  else changeZones(zones)
}

function handleQuit() {
  showZoneSheet.value = false
  router.push({ name: 'warmup-settings' })
}

function handleFinish() {
  showZoneSheet.value = false
  endSession()
}

const justCompleted = ref(false)
let _justCompletedTimer = null

watch(() => darts.value.length, async (newLen, oldLen) => {
  clearTimeout(_justCompletedTimer)
  if (newLen > oldLen && newLen > 0 && newLen % 3 === 0) {
    justCompleted.value = true
    _justCompletedTimer = setTimeout(() => { justCompleted.value = false }, 700)
    if (pendingZones.value) {
      changeZones(pendingZones.value)
      pendingZones.value = null
    }
    // Vérification des lancers spéciaux à chaque fin de volée
    const special = await badgeStore.checkSpecialThrow(darts.value)
    if (special.length) newBadges.value = [...newBadges.value, ...special]
  } else if (newLen < oldLen) {
    justCompleted.value = false
  }
})

const tourNumber = computed(() => {
  if (justCompleted.value) return Math.floor(darts.value.length / 3)
  return Math.floor(darts.value.length / 3) + 1
})

const displayedDarts = computed(() => {
  if (darts.value.length === 0) return []
  if (justCompleted.value) return darts.value.slice(-3)
  const inTurn = darts.value.length % 3
  return inTurn > 0 ? darts.value.slice(-inTurn) : []
})

// Last 5 completed volleys, newest first — every recorded non-miss dart is a hit
const recentRounds = computed(() => {
  const completed = Math.floor(darts.value.length / 3)
  return Array.from({ length: Math.min(completed, 5) }, (_, i) => {
    const tour = completed - i
    const volley = darts.value.slice((tour - 1) * 3, tour * 3)
    return { tour, hits: volley.filter(d => d.type !== 'miss').length }
  })
})

function recordMiss() {
  recordDart({ type: 'miss', sector: null, pts: 0, label: 'Miss' })
}

onMounted(() => startTimer())
onUnmounted(() => {
  cleanup()
  clearTimeout(_justCompletedTimer)
})
</script>

<template>
  <GameLayout
    title="Échauffement"
    tone="blue"
    :over="gameOver"
    @exit="router.push({ name: 'warmup-settings' })"
  >
    <template #header-right>
      <GameHeaderButton icon="gear" label="Choisir la prochaine zone" @click="openZoneSheet" />
    </template>

    <template #panel>
      <WarmupHero
        :tour="tourNumber"
        :streak="currentStreak"
        :time-display="timeDisplay"
        :is-unlimited="isUnlimited"
        :is-urgent="isUrgent"
        :target="formatZonesLabel(currentZones)"
        :stats="currentZoneStats"
        :rounds="recentRounds"
      />
    </template>

    <template #status>
      <GameStatusBar desktop-only :label="`Tour ${tourNumber}`">
        <GameStreakBadge :value="currentStreak" />
      </GameStatusBar>
    </template>

    <WarmupThrowPad
      :darts="displayedDarts"
      :zones="currentZones"
      :locked="justCompleted || showZoneSheet"
      @dart="recordDart"
      @miss="recordMiss"
      @undo="undoLast"
    />

    <template #over>
      <WarmupEndRecap
        :zone-recap-stats="zoneRecapStats"
        :session-stats="sessionStats"
        :duration-ms="totalDurationMs"
        @restart="router.push({ name: 'warmup-settings' })"
        @home="router.push({ name: 'home' })"
      />
    </template>

    <template #modals>
      <WarmupZoneSheet
        :show="showZoneSheet"
        :zones="pendingZones ?? currentZones"
        :mid-volley="midVolley"
        @close="closeZoneSheet"
        @zone-change="onZoneChange"
        @finish="handleFinish"
        @quit="handleQuit"
      />

      <BadgeUnlockOverlay :badges="newBadges" @done="newBadges = []" />
    </template>
  </GameLayout>
</template>
