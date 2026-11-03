<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useTactics } from '../composables/useTactics.js'
import TacticsInput from '../components/tactics/TacticsInput.vue'
import TacticsResult from '../components/tactics/TacticsResult.vue'
import TacticsBoard from '../components/tactics/TacticsBoard.vue'
import TacticsZoneChoiceModal from '../components/tactics/TacticsZoneChoiceModal.vue'
import TacticsLegRecap from '../components/tactics/TacticsLegRecap.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import GameLayout from '../components/game/GameLayout.vue'
import GameHeaderButton from '../components/game/GameHeaderButton.vue'
import GameStatusBar from '../components/game/GameStatusBar.vue'

const router    = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()
const dbStore   = useDbStore()

if (!gameStore.gameSettings) router.replace({ name: 'tactics-settings' })

const DEFAULT_PLAYERS = [{ id: 'me', name: 'Toi', isMe: true }]
const settings = gameStore.gameSettings ?? { players: DEFAULT_PLAYERS, legsToWin: 1 }
const players  = settings.players ?? DEFAULT_PLAYERS

const {
  zones,
  activeZoneId,
  currentDarts,
  phase,
  volleyCompleting,
  pendingZoneChoice,
  volleyNumber,
  addDart,
  addMiss,
  undo,
  resolveZoneChoice,
  startNextLeg,
  stats,
  currentPlayerIndex,
  playerCount,
  isMulti,
  meIndex,
  allCompletedLegs,
  lastLegWinnerIndex,
  zonesForPlayer,
  activeZoneIdForPlayer,
  computeStatsForPlayer,
} = useTactics(settings)

const SPECIAL_LABELS = { double: 'Double', triple: 'Triple', bull: 'Bull' }
const isOver = computed(() => phase.value === 'game-over')

const isLocked = computed(() => phase.value !== 'playing' || volleyCompleting.value || !!pendingZoneChoice.value)
const showMenu = ref(false)

function quitGame() {
  showMenu.value = false
  router.push({ name: 'tactics-settings' })
}

function finishGame() {
  showMenu.value = false
  phase.value    = 'game-over'
}

// ── Saisie (une seule zone active à la fois) ───────────────────────────────
// Phase nombres : S/D/T du nombre actif. Phase spéciales : uniquement le
// bouton de la zone visée (Double/Triple) ou Outer/Bull pour la zone Bull.
const inputTarget = computed(() => {
  const id = activeZoneId.value
  if (id == null) return null
  if (id === 'bull')                      return { sector: null, onlyType: null }
  if (id === 'double' || id === 'triple') return { sector: 20,   onlyType: id }
  return { sector: Number(id), onlyType: null }
})

const aimLabel = computed(() => SPECIAL_LABELS[activeZoneId.value] ?? activeZoneId.value)

// ── Choix de zone (phase nombres, double/triple ambigu) ─────────────────────
const zoneChoiceProps = computed(() => {
  const p = pendingZoneChoice.value
  if (!p) return { dartLabel: '', numberLabel: '', specialLabel: '' }
  return {
    dartLabel:    p.dart.label,
    numberLabel:  p.numberZoneId,
    specialLabel: SPECIAL_LABELS[p.specialZoneId],
  }
})

// ── Plateau partagé (tableau Zone × Joueurs) ────────────────────────────────
const boardPlayers = computed(() => {
  const cards = []
  for (let i = 0; i < playerCount; i++) {
    cards.push({
      name:         players[i]?.name ?? 'Joueur',
      zones:        zonesForPlayer(i),
      activeZoneId: activeZoneIdForPlayer(i),
      isCurrent:    i === currentPlayerIndex.value,
    })
  }
  return cards
})

const activePlayerName = computed(() => players[currentPlayerIndex.value]?.name ?? 'Joueur')

// ── Récap de manche (multi-joueurs uniquement, solo termine direct) ────────
const showLegRecap = computed(() => phase.value === 'leg-recap')
const recapWinnerName = computed(() =>
  lastLegWinnerIndex.value != null ? players[lastLegWinnerIndex.value]?.name ?? null : null
)
const recapLeg = computed(() => {
  if (lastLegWinnerIndex.value == null) return null
  const legs = allCompletedLegs[lastLegWinnerIndex.value].value
  return legs[legs.length - 1] ?? null
})

// ── Fin de partie ────────────────────────────────────────────────────────────
const resultPlayers = computed(() => players.map((p, i) => ({
  name:        p.name ?? 'Joueur',
  legsWon:     allCompletedLegs[i].value.length,
  closedZones: zonesForPlayer(i).filter(z => z.closed).length,
})))

// A game ended from the menu has no winner by legs: the leader takes the podium
const resultWinnerIndex = computed(() => {
  let best = 0
  resultPlayers.value.forEach((p, i) => {
    const b = resultPlayers.value[best]
    if (p.legsWon > b.legsWon || (p.legsWon === b.legsWon && p.closedZones > b.closedZones)) best = i
  })
  return best
})

// ── Sauvegarde en fin de partie ────────────────────────────────────────────
let saved = false
watch(phase, async (val) => {
  if (val !== 'game-over' || !stats.value || saved) return
  saved = true
  await dbStore.saveTacticsSession({
    legsPlayed: allCompletedLegs[meIndex].value.length,
    stats:      stats.value,
    settings: {
      ...settings,
      humanName: authStore.profile?.username ?? null,
      opponents: isMulti
        ? players
            .map((p, i) => ({ p, i }))
            .filter(({ i }) => i !== meIndex)
            .map(({ p, i }) => ({
              name:       p.name,
              legsWon:    allCompletedLegs[i].value.length,
              totalDarts: computeStatsForPlayer(i)?.totalDarts ?? null,
            }))
        : [],
    },
  })
})
</script>

<template>
  <GameLayout
    title="Tactics"
    tone="red"
    :over="isOver"
    bare-over
    style="--panel-flex: 0 1 auto; --entry-flex: 1 1 0%"
    @exit="router.push({ name: 'tactics-settings' })"
  >
    <template #header-right>
      <GameHeaderButton icon="gear" label="Réglages de la partie" @click="showMenu = true" />
    </template>

    <template #panel>
      <TacticsBoard :players="boardPlayers" />
    </template>

    <template #status>
      <GameStatusBar :label="`Tour ${volleyNumber}`">
        <span class="tactics__aim">
          <span class="tactics__aim-lead">Au tour de</span>
          <span class="tactics__aim-player">{{ activePlayerName }}</span>
        </span>
      </GameStatusBar>
    </template>

    <TacticsInput
      v-if="inputTarget"
      :darts="currentDarts"
      :target="inputTarget"
      :locked="isLocked"
      @dart="addDart"
      @miss="addMiss"
      @undo="undo"
    />

    <template #over>
      <TacticsResult
        :players="resultPlayers"
        :legs-to-win="settings.legsToWin"
        :winner-index="isMulti ? resultWinnerIndex : 0"
        :total-darts="stats?.totalDarts ?? null"
        :zone-count="zones.length"
        @replay="router.push({ name: 'tactics-settings' })"
        @home="router.push({ name: 'home' })"
        @quit="router.push({ name: 'tactics-settings' })"
      />
    </template>

    <template #modals>
      <TacticsLegRecap
        :show="showLegRecap"
        :winner-name="recapWinnerName ?? ''"
        :total-darts="recapLeg?.totalDarts ?? 0"
        :volleys="recapLeg?.volleys ?? []"
        @next="startNextLeg"
      />

      <GameMenuModal :show="showMenu" @close="showMenu = false" @finish="finishGame" @quit="quitGame" />
      <TacticsZoneChoiceModal
        :show="!!pendingZoneChoice"
        v-bind="zoneChoiceProps"
        @choose="resolveZoneChoice"
      />
    </template>
  </GameLayout>
</template>

<style lang="scss" scoped>
.tactics {
  &__aim {
    @include text-sm;
    display: flex;
    align-items: baseline;
    gap: $gap-xxs;
    min-width: 0;
    color: $muted;
  }

  &__aim-player {
    @include title-lg;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--tone);
  }
}

@media (min-width: $bp-laptop) {
  .tactics {
    &__aim { @include text-md; }
    &__aim-player { @include title-xl; }
  }
}
</style>
