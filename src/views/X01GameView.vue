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
import DartSlotsHeader from '../components/game/DartSlotsHeader.vue'
import GameInput from '../components/game/GameInput.vue'
import X01Result from '../components/x01/X01Result.vue'
import X01LegRecap from '../components/x01/X01LegRecap.vue'
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
  volleyNumber,
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
  lastLegWinnerIndex,
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
  aiLastVolley,
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

const headerTitle = `${settings.startScore} · ${settings.legsToWin} manche${settings.legsToWin > 1 ? 's' : ''}`

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

const resultTitle = computed(() => {
  if (isMulti) return multiWinnerName.value ? `${multiWinnerName.value} a gagné la partie !` : 'Partie terminée'
  return aiWonGame.value ? 'L\'IA a gagné la partie !' : 'Bien joué !'
})

const resultSubtitle = computed(() => {
  const legs = matchStats.value?.legs.length ?? 0
  return `${settings.startScore} pts · ${legs} manche${legs > 1 ? 's' : ''}`
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
  if (val && aiLegHumanSnapshot.value?.volleys?.length) {
    addLostLegVolleys(aiLegHumanSnapshot.value.volleys)
  }
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
  return avg == null ? '–' : avg.toFixed(2)
}

function checkoutPctLabel(idx) {
  const pct = checkoutPct(computePlayerStats(legsForAnalysis(idx), settings.startScore))
  return pct == null ? '–' : `${pct}%`
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
          legsToWin:  settings.legsToWin,
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
          legsToWin:  settings.legsToWin,
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
      legsToWin:  settings.legsToWin,
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

// ── Données récap de manche ────────────────────────────────────────────────
const showLegRecap = computed(() => phase.value === 'leg-recap' || aiWonLeg.value)
const legWinner    = computed(() => aiWonLeg.value ? 'ai' : 'human')
const lastLeg      = computed(() => completedLegs.value[completedLegs.value.length - 1])

const recapVolleys = computed(() =>
  legWinner.value === 'ai'
    ? (aiLegHumanSnapshot.value?.volleys ?? [])
    : (lastLeg.value?.volleys ?? [])
)

const recapTotalDarts = computed(() =>
  legWinner.value === 'ai'
    ? recapVolleys.value.reduce((sum, v) => sum + volleyDarts(v), 0)
    : (lastLeg.value?.totalDarts ?? 0)
)

// Multi-player leg recap: use tracked winner index from useX01
const multiLegWinner = computed(() => {
  if (!isMulti || lastLegWinnerIndex.value == null) return null
  const i    = lastLegWinnerIndex.value
  const legs = allCompletedLegs[i].value
  const last = legs[legs.length - 1] ?? null
  return last ? { playerIndex: i, name: players[i]?.name, leg: last } : null
})

function startNextLegWithAI() {
  aiRemaining.value = settings.startScore
  startNextLeg()
}

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

    <AppHeader :title="headerTitle" back-icon="exit" @back="router.push({ name: settingsRoute })">
      <template v-if="phase !== 'game-over'" #right>
        <button class="x01__menu-btn" @click="showMenu = true">
          <AppIcon name="gear" :width="22" :height="22" />
        </button>
      </template>
    </AppHeader>

    <!-- ── Jeu ──────────────────────────────────────────────────────────────── -->
    <div v-if="phase === 'playing' || isBust" class="x01__game">

      <div class="x01__game-left">
        <X01PlayerSplitCard
          :players="playerCards"
          :active-index="activeCardIndex"
        />
      </div>

      <div class="x01__game-main">
        <DartSlotsHeader :tour-number="isBust ? volleyNumber - 1 : volleyNumber">
          <template #right>
            <span v-if="targeting" class="x01__turn-label x01__turn-label--target">
              Où vises-tu ?
            </span>
            <span v-else-if="pendingTarget" class="x01__turn-label x01__turn-label--target">
              Visé {{ pendingTarget.label }} · touché ?
            </span>
            <span v-else-if="isOpponentTurn" class="x01__turn-label x01__turn-label--ai">
              {{ online.loading.value ? 'Connexion…' : `${activePlayerName} joue…` }}
              <span v-if="!online.loading.value && !online.opponentOnline.value" class="x01__offline">
                hors ligne
              </span>
            </span>
            <span
              v-else
              class="x01__turn-label"
              :class="{ 'x01__turn-label--ai': aiTurn && !isMulti }"
            >
              {{ aiTurn && !isMulti ? 'DartBot...' : `${activePlayerName} !` }}
            </span>
          </template>
        </DartSlotsHeader>
        <button v-if="online?.canUndoRemote.value" class="x01__remote-undo" @click="online.publishUndo">
          <AppIcon name="undo" :width="16" :height="16" />
          Annuler ma dernière volée
        </button>
        <GameInput
          :darts="currentVolleyDarts"
          value-key="label"
          :bust="isBust"
          :locked="isLocked || (aiTurn && !isMulti)"
          toggleable
          :force-dart="analysisZone"
          :targeting="targeting"
          @dart="handleDart"
          @miss="handleMiss"
          @bust="bustVolley"
          @validate="confirmVolleyTotal"
          @undo="handleUndo"
        />
      </div>
    </div>

    <!-- ── Récap de manche (vs AI) ──────────────────────────────────────────── -->
    <X01LegRecap
      v-if="!isMulti"
      :show="showLegRecap"
      :leg-winner="legWinner"
      :has-a-i="!!aiProfile"
      :human-remaining="aiLegHumanSnapshot?.remaining ?? legRemaining"
      :ai-remaining="aiRemaining"
      :total-darts="recapTotalDarts"
      :checkout-score="lastLeg?.checkoutScore ?? null"
      :ai-darts-used="aiLastVolley?.dartsUsed ?? null"
      :volleys="recapVolleys"
      @next="legWinner === 'ai' ? handleAILegContinue() : startNextLegWithAI()"
    />

    <!-- ── Récap de manche (multi-player) ────────────────────────────────────── -->
    <X01LegRecap
      v-if="isMulti"
      :show="phase === 'leg-recap'"
      leg-winner="human"
      :winner-name="multiLegWinner?.name ?? null"
      :has-a-i="false"
      :human-remaining="0"
      :ai-remaining="0"
      :total-darts="multiLegWinner?.leg?.totalDarts ?? 0"
      :checkout-score="multiLegWinner?.leg?.checkoutScore ?? null"
      :ai-darts-used="null"
      :volleys="multiLegWinner?.leg?.volleys ?? []"
      @next="startNextLeg"
    />

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
      :default-darts="pendingCheckout?.defaultDarts ?? 3"
      :checkout-score="pendingCheckout?.checkoutScore ?? 0"
      @confirm="confirmCheckout"
    />

    <!-- ── Résultats finaux ────────────────────────────────────────────────── -->
    <Transition name="slide-up">
      <div v-if="phase === 'game-over'" class="x01__overlay">

        <X01Result
          :match-stats="matchStats"
          :title="resultTitle"
          :subtitle="resultSubtitle"
          :emoji="aiWonGame ? '🤖' : '🏆'"
          :title-color="aiWonGame ? 'orange' : null"
          :replay-label="isTournamentMatch ? (isLeagueMatch ? 'Retour aux journées' : 'Retour au bracket') : 'Rejouer'"
          :checkout-analysis="checkoutAnalysis"
          @replay="handleReplay"
          @home="router.push({ name: 'home' })"
        />
      </div>
    </Transition>

  </div>
</template>

<style lang="scss" scoped>
.x01 {
  display: flex;
  flex-direction: column;
  gap: $gap-md;
  height: 100dvh;
  overflow: hidden;
  padding: $padding-md;

  &__menu-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__game {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__game-left {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    min-height: 0;
    overflow-y: auto;
  }

  &__game-main {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    flex: 1;
  }

  &__turn-label {
    @include title-sm;
    font-weight: 700;
    color: $orange;
    text-transform: uppercase;
    letter-spacing: 0.04em;

    &--ai     { color: $muted; }
    &--target { color: $accent; }
  }

  &__offline {
    @include text-xs;
    color: $error;
    text-transform: none;
    letter-spacing: 0;
  }

  &__remote-undo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    @include text-sm;
    color: $text-color;
    padding: $padding-sm $padding-md;
    border: $border-sm solid rgba($white, 0.12);
    border-radius: $radius-pill;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: $bg;
    z-index: 90;
    display: flex;
    padding: $padding-md;
  }
}

@media (min-width: $bp-tablet) {
  .x01__game {
    flex-direction: row;
    align-items: stretch;
    gap: $gap-lg;
  }

  .x01__game-left,
  .x01__game-main {
    flex: 1;
  }
}

@media (min-width: $bp-laptop) {
  .x01 {
    padding: $padding-xl;
  }

  .x01__game        { gap: $gap-xl; }
  .x01__turn-label  { @include title-md; }
  .x01__offline     { @include text-sm; }
  .x01__remote-undo { @include text-md; }
}

.slide-up-enter-active { transition: transform 0.3s ease, opacity 0.3s; }
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.2s; }
.slide-up-enter-from,
.slide-up-leave-to     { transform: translateY(40px); opacity: 0; }
</style>
