<script setup>
import { computed, watch, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import { useAuthStore } from '../store/authStore.js'
import { useX01 } from '../composables/useX01.js'
import { useX01AIOpponent } from '../composables/useX01AIOpponent.js'
import { useOnlineMatch } from '../composables/useOnlineMatch.js'
import { analyzeLegs, MAX_CHECKOUT } from '../composables/useCheckoutAnalysis.js'
import { buildMatchStats, checkoutPct, computePlayerStats, lastVolleyLabel, threeDartAverage, volleyDarts } from '../composables/useX01MatchStats.js'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useTournamentStore } from '../store/tournamentStore.js'
import GameInput from '../components/game/GameInput.vue'
import X01MatchEnd from '../components/x01/X01MatchEnd.vue'
import X01DoublesModal from '../components/x01/X01DoublesModal.vue'
import X01CheckoutModal from '../components/x01/X01CheckoutModal.vue'
import X01PlayerSplitCard from '../components/x01/X01PlayerSplitCard.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import AppIcon from '../components/AppIcon.vue'
import AppHeader from '../components/AppHeader.vue'

const router          = useRouter()
const route           = useRoute()
const gameStore       = useGameStore()
const authStore       = useAuthStore()
const dbStore         = useDbStore()
const badgeStore      = useBadgeStore()
const tournamentStore = useTournamentStore()

const newBadges  = ref([])

// Rechargement en plein match en ligne : la salle d'attente reconstruit gameSettings
if (!gameStore.gameSettings) {
  router.replace(route.query.online
    ? { name: 'online-match', params: { id: route.query.online } }
    : { name: 'x01-settings' })
}

const settings  = gameStore.gameSettings ?? { startScore: 501, legsToWin: 2, players: null }
const aiProfile = settings.aiProfile ?? null
const players   = settings.players ?? null   // null = legacy solo/vs-AI mode
const isMulti   = players && players.length > 1 && !aiProfile

const tournamentContext  = settings.tournamentContext ?? null
const isTournamentMatch  = !!tournamentContext
const onlineContext      = settings.online ?? null
const isOnline           = !!onlineContext
const settingsRoute      = isOnline ? 'online-settings' : 'x01-settings'
// False when a tournament host runs a match between two other players on this device
const deviceUserPlays    = !players || players.some(p => p.isMe)

const {
  completedLegs,
  volleys,
  currentDarts,
  phase,
  legRemaining,
  volleyRemaining,
  volleyCompleting,
  pendingDoublesPrompt,
  pendingCheckout,
  addDart,
  addMiss,
  undo,
  confirmVolleyTotal,
  bustVolley,
  confirmDoublesAttempted,
  confirmCheckout,
  startNextLeg,
  addLostLegVolleys,
  stats,
  // Multi-player extras
  currentPlayerIndex,
  legStarterIndex,
  playerCount,
  meIndex,
  allCompletedLegs,
  allVolleys,
  legClosed,
  applyVolley,
  removeLastVolley,
  resetMatch,
  computeStatsForPlayer,
  legsForAnalysis,
} = useX01({ ...settings, onVolleyCommitted: (e) => online?.publishVolley(e) })

const online = isOnline
  ? useOnlineMatch({
      matchId: onlineContext.matchId,
      myId:    authStore.user?.id,
      players,
      x01:     { currentPlayerIndex, currentDarts, legClosed, applyVolley, removeLastVolley, resetMatch },
    })
  : null
const isOpponentTurn = computed(() => isOnline && !online.isMyTurn.value)

const {
  aiRemaining,
  aiLegsWon,
  aiTurn,
  aiWonLeg,
  aiWonGame,
  aiLegs,
  aiLegHumanSnapshot,
  aiCardData,
  handleAILegContinue,
} = useX01AIOpponent({
  aiProfile,
  settings,
  volleys,
  phase,
  legRemaining,
  pendingDoublesPrompt,
  pendingCheckout,
  startNextLeg,
})

const legNumber = computed(() => 1 + (isMulti
  ? allCompletedLegs.reduce((sum, legs) => sum + legs.value.length, 0)
  : completedLegs.value.length + aiLegsWon.value))
const headerTitle = computed(() => `${settings.startScore} · Manche ${legNumber.value}`)

const isBust   = computed(() => phase.value === 'bust')
const isLocked = computed(() => phase.value !== 'playing' || volleyCompleting.value || isOpponentTurn.value)
const showMenu = ref(false)

// ── Analyse des checkouts : cible visée demandée avant chaque fléchette ────
const analysisZone = computed(() =>
  !!settings.checkoutAnalysis
  && currentPlayerIndex.value === meIndex
  && !aiTurn.value
  && volleyRemaining.value <= MAX_CHECKOUT
)
const pendingTarget = ref(null)
const targeting     = computed(() => analysisZone.value && !isLocked.value && !pendingTarget.value)

watch([currentPlayerIndex, phase], () => { pendingTarget.value = null })

function handleDart(dart) {
  if (targeting.value) {
    pendingTarget.value = dart
    return
  }
  addDart(pendingTarget.value ? { ...dart, target: pendingTarget.value } : dart)
  pendingTarget.value = null
}

function handleMiss() {
  addMiss(pendingTarget.value)
  pendingTarget.value = null
}

// En ligne, une volée déjà publiée ne s'annule que via publishUndo (bouton dédié)
const hasVolleyInProgress = computed(() =>
  currentDarts.value.length > 0 || isBust.value || volleyCompleting.value
)

function handleUndo() {
  if (pendingTarget.value) pendingTarget.value = null
  else if (!isOnline || hasVolleyInProgress.value) undo()
}

const checkoutAnalysis = computed(() => {
  if (!settings.checkoutAnalysis || phase.value !== 'game-over') return null
  const analysis = analyzeLegs(legsForAnalysis(meIndex), settings.startScore)
  return analysis.moves.length ? analysis : null
})

const matchStats = computed(() => {
  if (phase.value !== 'game-over') return null
  const resultPlayers = isMulti
    ? players.map(p => ({ name: p.name, isMe: !!p.isMe }))
    : [
        { name: authStore.profile?.username ?? 'Toi', isMe: true },
        ...(aiProfile ? [{ name: 'DartBot', isAI: true }] : []),
      ]
  const legsByPlayer = isMulti
    ? players.map((_, i) => legsForAnalysis(i))
    : [legsForAnalysis(meIndex), ...(aiProfile ? [aiLegs.value] : [])]
  const result = buildMatchStats({ players: resultPlayers, legsByPlayer, startScore: settings.startScore })
  return result.legs.length ? result : null
})

// Index in matchStats.players; null when the game was stopped before anyone won
const resultWinnerIndex = computed(() => {
  if (isMulti) return multiWinnerIndex.value
  if (aiWonGame.value) return 1
  return completedLegs.value.length >= settings.legsToWin ? 0 : null
})

const resultSubtitle = computed(() => {
  const legs = matchStats.value?.legs.length ?? 0
  return `${settings.startScore} · premier à ${settings.legsToWin} manche${settings.legsToWin > 1 ? 's' : ''} · ${legs} jouée${legs > 1 ? 's' : ''}`
})

const isLeagueMatch = isTournamentMatch
  && tournamentStore.activeTournament?.matches.find(m => m.id === tournamentContext.matchId)?.bracket_type === 'league'

function handleReplay() {
  if (isTournamentMatch) {
    const tab = isLeagueMatch ? 'matchdays' : 'bracket'
    router.push({ name: 'tournament-detail', params: { id: tournamentContext.tournamentId }, query: { tab } })
  } else {
    router.push({ name: settingsRoute })
  }
}

async function finishGame() {
  showMenu.value = false
  if (isOnline) await online.forfeit()
  phase.value    = 'game-over'
}

// L'adversaire a abandonné (ou terminé le match) pendant qu'on regardait
if (isOnline) {
  watch(() => online.match.value?.status, (status) => {
    if (['completed', 'abandoned'].includes(status) && phase.value !== 'game-over') phase.value = 'game-over'
  })
}

// Player order can differ from the bracket slots (starter choice), so match by identity
function legsWonBy(predicate) {
  const idx = players.findIndex(predicate)
  return idx >= 0 ? allCompletedLegs[idx].value.length : null
}

async function finalizeOnlineMatch() {
  const legsWinner = players.findIndex((_, i) => allCompletedLegs[i].value.length >= settings.legsToWin)
  if (legsWinner >= 0) await online.complete(players[legsWinner].id)
  if (isTournamentMatch && online.match.value?.winner_id) {
    const { host_id, guest_id } = online.match.value
    await dbStore.reportOnlineTournamentResult(onlineContext.matchId, {
      hostLegs:  legsWonBy(p => p.id === host_id),
      guestLegs: legsWonBy(p => p.id === guest_id),
    })
  }
}

function quitGame() {
  showMenu.value = false
  router.push({ name: settingsRoute })
}

watch(aiWonLeg, (val) => {
  if (!val) return
  if (aiLegHumanSnapshot.value?.volleys?.length) addLostLegVolleys(aiLegHumanSnapshot.value.volleys)
  handleAILegContinue()
})

// ── Lancers spéciaux en temps réel (utilisateur connecté = meIndex) ────────
watch(() => allVolleys[meIndex].value.length, async (newLen, oldLen) => {
  if (!deviceUserPlays || newLen <= oldLen || online?.loading.value) return
  const v = allVolleys[meIndex].value[newLen - 1]
  if (v.bust) return
  const isTotal = v.darts.length === 1 && v.darts[0].type === 'volley'
  const special = await badgeStore.checkSpecialThrow(
    isTotal ? [] : v.darts,
    isTotal ? v.score : null,
  )
  if (special.length) newBadges.value = [...newBadges.value, ...special]
})

// ── Sauvegarde en fin de partie ────────────────────────────────────────────
// Session from player idx's point of view, with the other players as opponents
function multiSessionFor(idx, legsPlayed) {
  const opponents = players
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i !== idx)
    .map(({ p, i }) => ({
      name:      p.name,
      legsWon:   allCompletedLegs[i].value.length,
      avgVolley: matchStats.value?.match[i]?.average ?? null,
      isFriend:  !!p.isFriend,
      friendId:  p.isFriend ? p.id : null,
    }))
  return {
    startScore: settings.startScore,
    legsPlayed,
    stats:      computeStatsForPlayer(idx),
    matchStats: matchStats.value && {
      ...matchStats.value,
      players: matchStats.value.players.map((p, i) => ({ ...p, isMe: i === idx })),
    },
    settings: {
      ...settings,
      humanName:    players[idx].isMe ? (authStore.profile?.username ?? null) : players[idx].name,
      humanLegsWon: allCompletedLegs[idx].value.length,
      opponents,
    },
    tournamentId:      tournamentContext?.tournamentId ?? null,
    tournamentMatchId: tournamentContext?.matchId ?? null,
  }
}

// Each player gets the session on their own account, once the result is recorded
// (the server only accepts sessions for a completed match)
async function saveLocalTournamentMatch(legsPlayed) {
  const match = tournamentStore.activeTournament?.matches.find(m => m.id === tournamentContext.matchId)
  await tournamentStore.recordMatchResult({
    matchId:             tournamentContext.matchId,
    winnerParticipantId: players[multiWinnerIndex.value].participantId,
    player1Legs:         legsWonBy(p => p.participantId === match?.player1_participant_id),
    player2Legs:         legsWonBy(p => p.participantId === match?.player2_participant_id),
  })
  await Promise.all(players.map((p, i) => dbStore.saveTournamentX01Session({
    matchId:       tournamentContext.matchId,
    participantId: p.participantId,
    session:       multiSessionFor(i, legsPlayed),
  })))
}

watch(phase, async (val) => {
  if (val !== 'game-over') return
  if (isOnline) await finalizeOnlineMatch()
  if (!stats.value) return

  const humanLegsWon = allCompletedLegs[meIndex].value.length
  const legsPlayed   = matchStats.value?.legs.length ?? 0

  if (isMulti && isTournamentMatch && !isOnline) {
    // An unfinished local tournament match is neither recorded nor saved
    if (multiWinnerIndex.value != null) await saveLocalTournamentMatch(legsPlayed)
  } else if (isMulti) {
    await dbStore.saveX01Session(multiSessionFor(meIndex, legsPlayed))
  } else {
    // Solo or vs AI (existing behavior)
    await dbStore.saveX01Session({
      startScore: settings.startScore,
      legsPlayed,
      stats:      stats.value,
      matchStats: matchStats.value,
      settings: {
        ...settings,
        humanName:    authStore.profile?.username ?? null,
        humanLegsWon,
        ...(aiProfile ? {
          aiLegsWon:   aiLegsWon.value,
          aiAvgVolley: matchStats.value?.match[1]?.average ?? null,
        } : {}),
      },
    })
  }

  const profileStats  = await dbStore.fetchProfileStats()
  const volumeBadges  = await badgeStore.checkX01Badges(profileStats)
  if (volumeBadges.length) newBadges.value = [...newBadges.value, ...volumeBadges]
})

// ── Données carte joueurs ──────────────────────────────────────────────────
const humanTotalDarts = computed(() =>
  volleys.value.reduce((sum, v) => sum + volleyDarts(v), 0)
  + (isBust.value || !currentDarts.value.length ? 0 : volleyDarts({ darts: currentDarts.value }))
)

const humanLastScore = computed(() => lastVolleyLabel(volleys.value))

// Average and checkout % over the whole game so far (current leg included)
function averageLabel(idx) {
  const avg = threeDartAverage(legsForAnalysis(idx).flatMap(l => l.volleys))
  return avg == null ? '–' : avg.toFixed(1).replace('.', ',')
}

function checkoutPctLabel(idx) {
  const pct = checkoutPct(computePlayerStats(legsForAnalysis(idx), settings.startScore))
  return pct == null ? '–' : `${Math.round(pct)} %`
}

// Build player cards for X01PlayerSplitCard
const playerCards = computed(() => {
  const cards = []

  if (isMulti) {
    // Multi-player human cards
    for (let i = 0; i < playerCount; i++) {
      const p         = players[i]
      const pVolleys  = allCompletedLegs[i]  // use the allCompletedLegs ref
      const isCurrent = i === currentPlayerIndex.value

      // For current player: use live data; for others: use stored state
      if (isCurrent) {
        cards.push({
          name:       p.name,
          remaining:  legRemaining.value,
          legsWon:    allCompletedLegs[i].value.length,
          avgVolley:  averageLabel(i),
          lastScore:  humanLastScore.value,
          totalDarts: humanTotalDarts.value,
          checkoutPct: checkoutPctLabel(i),
          isLegStarter: i === legStarterIndex.value,
        })
      } else {
        const pVols       = allVolleys[i].value
        const pRemaining  = pVols.filter(v => !v.bust).reduce((acc, v) => acc - v.score, settings.startScore)
        cards.push({
          name:       p.name,
          remaining:  pRemaining,
          legsWon:    allCompletedLegs[i].value.length,
          avgVolley:  averageLabel(i),
          lastScore:  lastVolleyLabel(pVols),
          totalDarts: pVols.reduce((sum, v) => sum + volleyDarts(v), 0),
          checkoutPct: checkoutPctLabel(i),
          isLegStarter: i === legStarterIndex.value,
        })
      }
    }
  } else {
    // Single player card (original behavior)
    cards.push({
      name:       authStore.profile?.username ?? 'Toi',
      remaining:  legRemaining.value,
      legsWon:    completedLegs.value.length,
      avgVolley:  averageLabel(meIndex),
      lastScore:  humanLastScore.value,
      totalDarts: humanTotalDarts.value,
      checkoutPct: checkoutPctLabel(meIndex),
    })

    // AI card
    if (aiProfile && aiCardData.value) {
      cards.push({ ...aiCardData.value, isAI: true })
    }
  }

  return cards
})

const activeCardIndex = computed(() => {
  if (isMulti) return currentPlayerIndex.value
  return aiTurn.value ? 1 : 0
})

// Active player name for turn label
const activePlayerName = computed(() => {
  if (isMulti) return players[currentPlayerIndex.value]?.name ?? 'Joueur'
  return aiTurn.value ? 'DartBot' : (authStore.profile?.username ?? 'Toi')
})

const currentVolleyDarts = computed(() => {
  if (isBust.value) return volleys.value[volleys.value.length - 1]?.darts ?? []
  return isOpponentTurn.value ? online.liveDarts.value : currentDarts.value
})

// Reste avant la volée qui déclenche le prompt des doubles (elle est déjà enregistrée)
const doublesPromptStartRemaining = computed(() => {
  const last = volleys.value[volleys.value.length - 1]
  return last ? legRemaining.value + (last.bust ? 0 : last.score) : null
})

// ── Enchaînement des manches (pas de récap entre deux manches) ────────────
// A human win closes the AI's leg in useX01AIOpponent first (its watcher was registered earlier)
watch(phase, (val) => {
  if (val !== 'leg-recap') return
  aiRemaining.value = settings.startScore
  startNextLeg()
})

// Winner in multi-player
const multiWinnerIndex = computed(() => {
  if (!isMulti || phase.value !== 'game-over') return null
  // Abandon en ligne : le vainqueur n'a pas forcément gagné ses manches
  const onlineWinnerId = online?.match.value?.winner_id
  if (onlineWinnerId) return players.findIndex(p => p.id === onlineWinnerId)
  for (let i = 0; i < playerCount; i++) {
    if (allCompletedLegs[i].value.length >= settings.legsToWin) return i
  }
  return null
})

const multiWinnerName = computed(() =>
  multiWinnerIndex.value != null ? players[multiWinnerIndex.value]?.name ?? 'Joueur' : null
)
</script>

<template>
  <div class="x01">

    <!-- ── Jeu ──────────────────────────────────────────────────────────────── -->
    <section class="x01__panel">
      <AppHeader :title="headerTitle" tone="green" back-icon="exit" @back="router.push({ name: settingsRoute })">
        <template v-if="phase !== 'game-over'" #right>
          <button class="x01__menu-btn" aria-label="Menu" @click="showMenu = true">
            <AppIcon name="gear" :width="22" :height="22" />
          </button>
        </template>
      </AppHeader>

      <div class="x01__players">
        <X01PlayerSplitCard :players="playerCards" :active-index="activeCardIndex" />

        <p v-if="targeting" class="x01__status">Où vises-tu ?</p>
        <p v-else-if="pendingTarget" class="x01__status">Visé {{ pendingTarget.label }} · touché ?</p>
        <p v-else-if="isOpponentTurn" class="x01__status">
          {{ online.loading.value ? 'Connexion…' : `${activePlayerName} joue…` }}
          <span v-if="!online.loading.value && !online.opponentOnline.value" class="x01__offline">hors ligne</span>
        </p>
      </div>
    </section>

    <main class="x01__entry">
      <button v-if="online?.canUndoRemote.value" class="x01__remote-undo" @click="online.publishUndo">
        <AppIcon name="undo" :width="16" :height="16" />
        Annuler ma dernière volée
      </button>
      <GameInput
        :darts="currentVolleyDarts"
        value-key="label"
        :bust="isBust"
        :locked="isLocked || (aiTurn && !isMulti)"
        :force-dart="analysisZone"
        :targeting="targeting"
        @dart="handleDart"
        @miss="handleMiss"
        @bust="bustVolley"
        @validate="confirmVolleyTotal"
        @undo="handleUndo"
      />
    </main>

    <!-- ── Modales ──────────────────────────────────────────────────────────── -->
    <BadgeUnlockOverlay :badges="newBadges" @done="newBadges = []" />
    <GameMenuModal
      :show="showMenu"
      :finish-label="isOnline ? 'Abandonner le match' : undefined"
      :quit-label="isOnline ? 'Quitter (reprendre plus tard)' : undefined"
      @close="showMenu = false"
      @finish="finishGame"
      @quit="quitGame"
    />
    <X01DoublesModal
      :show="pendingDoublesPrompt"
      :start-remaining="doublesPromptStartRemaining"
      @confirm="confirmDoublesAttempted"
    />
    <X01CheckoutModal
      :show="!!pendingCheckout"
      :winner-name="activePlayerName"
      :default-darts="pendingCheckout?.defaultDarts ?? 3"
      :checkout-score="pendingCheckout?.checkoutScore ?? 0"
      @confirm="confirmCheckout"
    />

    <!-- ── Résultats finaux ────────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <X01MatchEnd
        v-if="phase === 'game-over'"
        class="x01__result"
        :match-stats="matchStats"
        :winner-index="resultWinnerIndex"
        :subtitle="resultSubtitle"
        :replay-label="isTournamentMatch ? (isLeagueMatch ? 'Retour aux journées' : 'Retour au bracket') : 'Rejouer'"
        :checkout-analysis="checkoutAnalysis"
        @replay="handleReplay"
        @home="router.push({ name: 'home' })"
      />
    </Transition>

  </div>
</template>

<style lang="scss" scoped>
.x01 {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: $bg;

  &__panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: $accent;
  }

  &__players {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: 0 $padding-md $padding-sm;
  }

  &__menu-btn {
    color: $white;
    display: flex;
    align-items: center;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__status {
    flex-shrink: 0;
    @include title-sm;
    color: $white;
    text-align: center;
  }

  &__offline {
    @include text-xs;
    color: $error-light;
    text-transform: none;
  }

  // Same height whatever the input mode, so the score panel never jumps
  &__entry {
    flex-shrink: 0;
    height: 480px;
    max-height: 62dvh;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: $padding-sm $padding-md 0;
    @include safe-bottom($padding-md);
  }

  &__remote-undo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    @include text-sm;
    color: $text-color;
    padding: $padding-xs $padding-md;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__result {
    position: fixed;
    inset: 0;
    z-index: 90;
  }
}

@media (min-width: $bp-laptop) {
  .x01 {
    flex-direction: row;

    &__panel   { flex: 1; min-width: 0; padding: $padding-md; }
    &__players { padding: 0 $padding-md $padding-md; gap: $gap-md; }
    &__status  { @include title-md; }
    &__offline { @include text-sm; }

    &__entry {
      flex: 1;
      min-width: 0;
      height: auto;
      max-height: none;
      gap: $gap-md;
      padding: $padding-xxl $padding-xxl 0;
      @include safe-bottom($padding-xxl);
    }

    &__remote-undo { @include text-md; }
  }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
