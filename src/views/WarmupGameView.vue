<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useWarmup, formatZoneLabel } from '../composables/useWarmup.js'
import { saveWarmupSession, fetchProfileStats } from '../store/dbStore.js'
import { checkWarmupBadges, checkSpecialThrow } from '../store/badgeStore.js'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import StatsCard from '../components/game/StatsCard.vue'
import WarmupDartSlots from '../components/warmup/WarmupDartSlots.vue'
import SectorGrid from '../components/game/SectorGrid.vue'
import GameBottomBar from '../components/game/GameBottomBar.vue'
import WarmupRecap from '../components/warmup/WarmupRecap.vue'
import WarmupZoneModal from '../components/warmup/WarmupZoneModal.vue'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()

if (!gameSettings.value) router.replace({ name: 'warmup-settings' })

const {
  timeDisplay, isUnlimited, isUrgent, gameOver,
  currentZone, currentZoneStats, zoneRecapStats, sessionStats,
  darts, recordDart, undoLast, changeZone, startTimer, endSession, cleanup,
} = useWarmup(gameSettings.value ?? { duration: 5, zone: { sector: 20, type: 'D' } })

watch(gameOver, async (val) => {
  if (val) {
    const duration = gameSettings.value?.duration
    await saveWarmupSession({
      zone:        currentZone.value,
      totalDarts:  sessionStats.value.total,
      hits:        sessionStats.value.hits,
      durationS:   duration !== null ? duration * 60 : null,
      settings:    gameSettings.value,
    })
    const stats = await fetchProfileStats()
    newBadges.value = await checkWarmupBadges({
      totalDarts:      sessionStats.value.total,
      accuracy:        sessionStats.value.accuracy,
      cumulativeStats: stats,
    })
  }
})

const showZoneModal = ref(false)

const newBadges = ref([])

const justCompleted = ref(false)
let _justCompletedTimer = null

watch(() => darts.value.length, async (newLen, oldLen) => {
  clearTimeout(_justCompletedTimer)
  if (newLen > oldLen && newLen > 0 && newLen % 3 === 0) {
    justCompleted.value = true
    _justCompletedTimer = setTimeout(() => { justCompleted.value = false }, 700)
    // Vérification des lancers spéciaux à chaque fin de volée
    const special = await checkSpecialThrow(darts.value)
    if (special.length) newBadges.value = [...newBadges.value, ...special]
  } else if (newLen < oldLen) {
    justCompleted.value = false
  }
})

const tourNumber = computed(() => {
  if (justCompleted.value) return Math.floor(darts.value.length / 3)
  return Math.floor(darts.value.length / 3) + 1
})

const statsRows = computed(() => [
  { label: 'Fléchettes jetées',   value: currentZoneStats.value.total },
  { label: 'Fléchettes touchées', value: currentZoneStats.value.hits },
  { label: 'Taux de réussite',    value: `${currentZoneStats.value.accuracy}%` },
])

const displayedDarts = computed(() => {
  if (darts.value.length === 0) return []
  if (justCompleted.value) return darts.value.slice(-3)
  const inTurn = darts.value.length % 3
  return inTurn > 0 ? darts.value.slice(-inTurn) : []
})

onMounted(() => startTimer())
onUnmounted(() => {
  cleanup()
  clearTimeout(_justCompletedTimer)
})
</script>

<template>
  <div class="warmup">

    <header class="warmup__header">
      <button class="warmup__header-btn" @click="router.push({ name: 'warmup-settings' })">
        <AppIcon name="exit" :width="22" :height="22" />
      </button>
      <h1 class="warmup__header-title">ECHAUFFEMENT</h1>
      <button class="warmup__header-btn" @click="showZoneModal = true">
        <AppIcon name="gear" :width="22" :height="22" />
      </button>
    </header>

    <div v-if="!gameOver" class="warmup__game">
      <StatsCard class="warmup__stats-card" color="#1D4ED8" :rows="statsRows">
        {{ formatZoneLabel(currentZone) }}
      </StatsCard>
      <div class="warmup__game-main">
        <WarmupDartSlots :darts="displayedDarts" :tourNumber="tourNumber" :timeDisplay="timeDisplay"
          :isUnlimited="isUnlimited" :isUrgent="isUrgent" />
        <SectorGrid :locked="justCompleted" @dart="recordDart" />
        <GameBottomBar :locked="justCompleted" right-icon="stop" @undo="undoLast"
          @miss="recordDart({ type: 'miss', sector: null, pts: 0, label: 'Miss' })" @right="endSession" />
      </div>
    </div>

    <WarmupRecap v-else :zoneRecapStats="zoneRecapStats" :sessionStats="sessionStats"
      @restart="router.push({ name: 'warmup-game', query: { t: Date.now() } })"
      @home="router.push({ name: 'play' })" />

    <WarmupZoneModal :show="showZoneModal" :zone="currentZone" @update:show="showZoneModal = $event"
      @confirm="zone => { changeZone(zone); showZoneModal = false }" />

    <BadgeUnlockOverlay :badges="newBadges" @done="newBadges = []" />
  </div>
</template>

<style lang="scss" scoped>
.warmup {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  height: 100dvh;
  overflow: hidden;
  padding: $padding-md;
  max-width: 420px;
  margin: 0 auto;
}

.warmup__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.warmup__header-btn {
  color: $text-color;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.6;
  }
}

.warmup__header-title {
  @include title-sm;
  color: $text-color;
  text-align: center;
}

.warmup__game {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-md;
}

.warmup__game-main {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
}

@media (min-width: $bp-tablet) {
  .warmup__game-main {
    flex: 1;
    min-height: 0;
  }
}

@media (min-width: $bp-laptop) {
  .warmup {
    max-width: none;
    padding: $padding-xxl;
  }

  .warmup__game {
    flex-direction: row;
    align-items: stretch;
  }

  .warmup__stats-card {
    flex: 1;
    min-height: 50%;
  }

  .warmup__game-main {
    flex: 1;
    margin: auto;
  }
}
</style>
