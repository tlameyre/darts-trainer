<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameSettings } from '../store/gameStore.js'
import { useWarmup, formatZoneLabel } from '../composables/useWarmup.js'
import { saveWarmupSession, fetchProfileStats } from '../store/dbStore.js'
import { checkWarmupBadges, checkSpecialThrow } from '../store/badgeStore.js'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import StatsCard from '../components/game/StatsCard.vue'
import DartSlotsHeader from '../components/game/DartSlotsHeader.vue'
import GameInput from '../components/game/GameInput.vue'
import WarmupRecap from '../components/warmup/WarmupRecap.vue'
import WarmupZoneModal from '../components/warmup/WarmupZoneModal.vue'
import AppIcon from '../components/AppIcon.vue'
import AppHeader from '../components/AppHeader.vue'

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

    <AppHeader title="ECHAUFFEMENT" back-icon="exit" @back="router.push({ name: 'warmup-settings' })">
      <template #right>
        <button class="warmup__gear-btn" @click="showZoneModal = true">
          <AppIcon name="gear" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <div v-if="!gameOver" class="warmup__game">
      <StatsCard class="warmup__stats-card" color="#1D4ED8" :rows="statsRows">
        {{ formatZoneLabel(currentZone) }}
      </StatsCard>
      <div class="warmup__game-main">
        <DartSlotsHeader :tour-number="tourNumber">
          <template #right>
            <div v-if="!isUnlimited" class="warmup__timer" :class="{ 'warmup__timer--urgent': isUrgent }">
              <AppIcon name="clock" :width="24" :height="24" />
              <span class="warmup__timer-text">{{ timeDisplay }}</span>
            </div>
          </template>
        </DartSlotsHeader>
        <GameInput
          :darts="displayedDarts"
          value-key="pts"
          :locked="justCompleted"
          @dart="recordDart"
          @miss="recordDart({ type: 'miss', sector: null, pts: 0, label: 'Miss' })"
          @undo="undoLast"
        >
          <template #right>
            <button class="warmup__stop-btn" @click="endSession">
              <AppIcon name="stop" :width="24" :height="24" />
            </button>
          </template>
        </GameInput>
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
}

.warmup__gear-btn,
.warmup__stop-btn {
  color: $text-color;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;

  &:active { opacity: 0.6; }
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

.warmup__timer {
  @include title-md;
  display: flex;
  align-items: center;
  gap: $gap-xs;
  transition: color 0.3s;

  &--urgent { color: $error; }
}

.warmup__timer-text {
  display: inline-block;
  min-width: 4ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (min-width: $bp-tablet) {
  .warmup__game-main {
    flex: 1;
    min-height: 0;
  }
}

@media (min-width: $bp-laptop) {
  .warmup {
    padding: $padding-xl;
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

  .warmup__timer { @include title-lg; }
}
</style>
