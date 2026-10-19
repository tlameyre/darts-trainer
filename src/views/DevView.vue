<script setup>
/**
 * Playground de développement — accessible uniquement via /dev en mode dev.
 * Permet d'afficher chaque composant conditionnel (overlays, modals, écrans)
 * avec des données factices, sans remplir les conditions réelles.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BADGES } from '../data/badges.js'

import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import BadgeDetailModal from '../components/badges/BadgeDetailModal.vue'
import GameOver from '../components/GameOver.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import ChangeEmailModal from '../components/profile/ChangeEmailModal.vue'
import ChangePasswordModal from '../components/profile/ChangePasswordModal.vue'
import X01DoublesModal from '../components/x01/X01DoublesModal.vue'
import X01CheckoutModal from '../components/x01/X01CheckoutModal.vue'
import SvgDartboard from '../components/x01/SvgDartboard.vue'
import GameInput from '../components/game/GameInput.vue'
import X01CheckoutReview from '../components/x01/X01CheckoutReview.vue'
import X01Result from '../components/x01/X01Result.vue'
import { buildMatchStats } from '../composables/useX01MatchStats.js'
import { analyzeLegs, ALL_SEGMENTS } from '../composables/useCheckoutAnalysis.js'
import FriendsView from './FriendsView.vue'
import StatsWarmupDetailView from './StatsWarmupDetailView.vue'
import StatsSessionDetail from '../components/stats/StatsSessionDetail.vue'
import TournamentView from './TournamentView.vue'
import TournamentJoinView from './TournamentJoinView.vue'
import OnlineMatchLobbyView from './OnlineMatchLobbyView.vue'
import { generateBracket, resolveMatches } from '../composables/useTournamentBracket.js'
import { generateLeagueSchedule, computeStandings } from '../composables/useChampionship.js'
import { useGameStore } from '../store/gameStore.js'

const router    = useRouter()
const gameStore = useGameStore()

// --- Preview FriendsView ---
const showFriendsPreview = ref(false)

// --- Preview TournamentView (bracket avec byes + double élimination + pending) ---
const MOCK_HOSTS = [{ user_id: 'mock-me', role: 'creator' }]

function buildMockTournament({ playerCount, doubleElimination }) {
  const roster = Array.from({ length: playerCount }, (_, i) => ({ id: `p${i + 1}`, name: `Joueur ${i + 1}` }))
  const { seeded, matches } = generateBracket({ roster, seedingMethod: 'manual', doubleElimination })
  const seedToParticipantId = Object.fromEntries(seeded.map(p => [p.seed, `part-${p.seed}`]))
  const resolved = resolveMatches(matches, seedToParticipantId).map(m => ({
    id: m.key,
    round: m.round,
    bracket_type: m.bracketType,
    slot_in_round: m.slotInRound,
    player1_participant_id: m.player1ParticipantId,
    player2_participant_id: m.player2ParticipantId,
    winner_participant_id: m.winnerParticipantId,
    status: m.status,
    next_match_id: m.nextMatchKey,
    next_match_slot: m.nextMatchSlot,
    loser_next_match_id: m.loserNextMatchKey,
    loser_next_match_slot: m.loserNextMatchSlot,
    player1_legs: null,
    player2_legs: null,
    forfeited: false,
  }))
  // Shows every card state: first playable match won 2-1 (winner advanced), second one live
  const [played, live] = resolved.filter(m => m.status === 'ready')
  if (played) {
    Object.assign(played, { status: 'completed', winner_participant_id: played.player1_participant_id, player1_legs: 2, player2_legs: 1 })
    const next = resolved.find(m => m.id === played.next_match_id)
    if (next) {
      next[`player${played.next_match_slot}_participant_id`] = played.player1_participant_id
      if (next.player1_participant_id && next.player2_participant_id) next.status = 'ready'
    }
  }
  if (live) live.status = 'in_progress'
  return {
    tournament: {
      id: 'mock-tournament', name: `Mock ${playerCount} joueurs${doubleElimination ? ' — double élim' : ''}`,
      description: 'Tournoi de démonstration', join_code: 'T-DEV01',
      start_score: 501, legs_to_win: 2, status: 'in_progress', winner_participant_id: null,
    },
    hosts: MOCK_HOSTS,
    participants: seeded.map(p => ({ id: `part-${p.seed}`, seed: p.seed, player_data: { name: p.name } })),
    matches: resolved,
  }
}
function buildMockPendingTournament() {
  return {
    tournament: {
      id: 'mock-pending', name: 'Tournoi pas encore démarré',
      description: 'En attente de participants', join_code: 'T-DEV02',
      start_score: 501, legs_to_win: 2, status: 'pending', winner_participant_id: null,
    },
    hosts: MOCK_HOSTS,
    participants: [
      { id: 'part-1', seed: null, user_id: 'mock-me', player_data: { name: 'Toi' } },
      { id: 'part-2', seed: null, player_data: { name: 'Bob' } },
    ],
    matches: [],
  }
}
// Championnat : les journées <= playedRounds sont jouées (le plus petit seed gagne,
// 2-0 ou 2-1), un match de la journée suivante est en cours. Avec withPlayoffs,
// toute la ligue est jouée et le bracket du top playoffSize est généré.
function buildMockChampionship({ playerCount, doubleRoundRobin, playoffSize, playedRounds, withPlayoffs = false }) {
  const participants = Array.from({ length: playerCount }, (_, i) => ({
    id: `part-${i + 1}`, seed: i + 1, user_id: i === 0 ? 'mock-me' : `mock-u${i + 1}`, player_data: { name: i === 0 ? 'Toi' : `Joueur ${i + 1}` },
  }))
  const toRow = (m, seedToId) => ({
    id: m.key, round: m.round, bracket_type: m.bracketType, slot_in_round: m.slotInRound,
    player1_participant_id: seedToId[m.player1Seed] ?? null, player2_participant_id: seedToId[m.player2Seed] ?? null,
    winner_participant_id: null, status: m.status,
    next_match_id: m.nextMatchKey ?? null, next_match_slot: m.nextMatchSlot ?? null,
    player1_legs: null, player2_legs: null, forfeited: false,
  })
  const seedToId = Object.fromEntries(participants.map(p => [p.seed, p.id]))
  const matches  = generateLeagueSchedule({ participantCount: playerCount, doubleRoundRobin }).map(m => toRow(m, seedToId))

  const lastPlayed = withPlayoffs ? Infinity : playedRounds
  matches.forEach((m, i) => {
    if (m.round > lastPlayed) return
    const p1Wins = m.player1_participant_id < m.player2_participant_id
    Object.assign(m, {
      status: 'completed',
      winner_participant_id: p1Wins ? m.player1_participant_id : m.player2_participant_id,
      player1_legs: p1Wins ? 2 : i % 2,
      player2_legs: p1Wins ? i % 2 : 2,
    })
  })
  const live = matches.find(m => m.status === 'ready')
  if (live) live.status = 'in_progress'

  if (withPlayoffs) {
    const roster = computeStandings(matches, participants).slice(0, playoffSize).map(r => ({ ...r.participant.player_data, rowId: r.participant.id }))
    const { seeded, matches: bracket } = generateBracket({ roster, seedingMethod: 'manual', doubleElimination: false })
    const playoffSeedToId = Object.fromEntries(seeded.map(p => [p.seed, p.rowId]))
    matches.push(...bracket.map(m => toRow(m, playoffSeedToId)))
  }

  // Une session X01 fictive par joueur et par match de ligue joué (onglet Stats)
  const playerSessions = matches
    .filter(m => m.bracket_type === 'league' && m.status === 'completed')
    .flatMap((m, i) => [m.player1_participant_id, m.player2_participant_id].map((pid, side) => {
      const p   = participants.find(x => x.id === pid)
      const won = m.winner_participant_id === pid
      const avg = 35 + ((p.seed * 11 + i * 7 + side * 5) % 40)
      const own = {
        legsWon: won ? 2 : side ? m.player2_legs : m.player1_legs, average: avg, first9Average: avg + 4,
        checkoutHits: won ? 2 : 0, checkoutAttempts: (won ? 2 : 0) + ((i + side) % 4),
        highestFinish: won ? 40 + ((i * 13 + p.seed) % 90) : null, darts: 45, bestLeg: won ? 15 + ((i + p.seed) % 10) : null,
      }
      return {
        user_id: p.user_id, tournament_match_id: m.id, legs_played: 3,
        highest_volley: 60 + ((i * 17 + p.seed * 5) % 121),
        match_stats: { players: [{ name: p.player_data.name, isMe: true }], match: [own], legs: [] },
      }
    }))

  return {
    playerSessions,
    tournament: {
      id: 'mock-championship', name: `Championnat ${playerCount} joueurs${doubleRoundRobin ? ' — aller-retour' : ''}`,
      description: 'Championnat de démonstration', join_code: 'T-DEV03', format: 'championship',
      start_score: 501, legs_to_win: 2, status: 'in_progress', winner_participant_id: null,
      double_round_robin: doubleRoundRobin, playoff_size: playoffSize,
    },
    hosts: MOCK_HOSTS,
    participants,
    matches,
  }
}
const mockChampionshipOngoing  = buildMockChampionship({ playerCount: 9, doubleRoundRobin: true, playoffSize: 4, playedRounds: 5 })
const mockChampionshipPlayoffs = buildMockChampionship({ playerCount: 4, doubleRoundRobin: true, playoffSize: 2, withPlayoffs: true })
const showChampionshipOngoingPreview  = ref(false)
const showChampionshipPlayoffsPreview = ref(false)
const mockTournamentByes       = buildMockTournament({ playerCount: 5, doubleElimination: false })
const mockTournamentDoubleElim = buildMockTournament({ playerCount: 4, doubleElimination: true })
const mockTournamentPending    = buildMockPendingTournament()
const showTournamentByesPreview       = ref(false)
const showTournamentDoubleElimPreview = ref(false)
const showTournamentPendingPreview    = ref(false)
const showTournamentJoinPreview       = ref(false)
// --- Mock data OnlineMatchLobbyView ---
const mockOnlineMatch = (status) => ({
  id: 'mock-online', status, host_id: 'me', guest_id: 'u1', tournament_match_id: null,
  host:  { id: 'me', username: 'Théotime' },
  guest: { id: 'u1', username: 'luca92' },
  settings: { startScore: 501, legsToWin: 2, players: [{ id: 'u1', name: 'luca92' }, { id: 'me', name: 'Théotime' }] },
})
const onlineLobbyPreview = ref(null) // { match, myId }

const mockJoinPreview = {
  name: 'Tournoi de démonstration', description: 'Preview de la page de rejoindre',
  host_name: 'Théotime', participant_count: 2, status: 'pending',
}

function openMockTournamentMatch() {
  gameStore.gameSettings = {
    mode: 'x01', startScore: 501, legsToWin: 1, aiProfile: null,
    players: [
      { id: 'mock-p1', name: 'Joueur 1', participantId: 'mock-part-1' },
      { id: 'mock-p2', name: 'Joueur 2', participantId: 'mock-part-2' },
    ],
    // id de tournoi/match factices : "Retour au bracket" pointera vers un tournoi
    // inexistant, ce qui est attendu ici — utile uniquement pour vérifier le bouton.
    tournamentContext: { tournamentId: 'mock-tournament', matchId: 'mock-match' },
  }
  router.push({ name: 'x01-game' })
}

// --- Preview partie Tactics (données fictives) ---
const MOCK_TACTICS_PLAYERS = [
  { id: 'mock-me', name: 'Toi', isMe: true },
  { id: 'mock-p2', name: 'Bob', isFriend: true },
  { id: 'mock-p3', name: 'Clara', isFriend: true },
  { id: 'mock-p4', name: 'Dan', isFriend: true },
]
function openMockTacticsGame({ playerCount = 2 } = {}) {
  gameStore.gameSettings = {
    mode: 'tactics',
    legsToWin: 2,
    players: MOCK_TACTICS_PLAYERS.slice(0, playerCount),
  }
  router.push({ name: 'tactics-game' })
}

function openMockCheckoutGame(variant = 'review') {
  gameStore.gameSettings = {
    mode: 'checkout',
    variant,
    brackets: [[2, 40], [41, 60], [61, 80], [81, 90], [91, 100], [101, 130], [131, 170]],
    order: variant === 'quiz' ? 'random' : 'asc',
    count: 10,
  }
  router.push({ name: 'checkout-game' })
}

// --- Preview SvgDartboard ---
const showDartboardPreview = ref(false)
const lastDart = ref(null)

// --- Preview GameInput (avec popover de sélection de mode) ---
const showGameInputPreview = ref(false)
const mockDarts = ref([])
function onMockDart(d) {
  if (mockDarts.value.length >= 3) mockDarts.value = []
  mockDarts.value = [...mockDarts.value, d]
}

// --- Preview X01CheckoutReview (revue des checkouts, départ fictif à 170) ---
const showCheckoutReviewPreview = ref(false)

// ─── X01Result — stats de fin de match fictives (2 joueurs, 3 legs) ──────────
const showX01ResultPreview = ref(false)
// scores: points par volée (volée de 3 fléchettes), 'B' = bust ; doubles: doubles tentés sur la dernière volée
function mockLeg(scores, { won = false, dartsToFinish = 3, doubles = 0 } = {}) {
  const volleys = scores.map(sc => (sc === 'B'
    ? { darts: [{}, {}, {}], bust: true, score: 0 }
    : { darts: [{}, {}, {}], bust: false, score: sc }))
  volleys[volleys.length - 1] = won
    ? { ...volleys[volleys.length - 1], dartsToFinish, doublesThrown: doubles }
    : { ...volleys[volleys.length - 1], doublesAttempted: doubles }
  return { volleys, won, checkoutScore: won ? scores[scores.length - 1] : null }
}
const mockMatchStats = buildMatchStats({
  startScore: 501,
  players: [{ name: 'Theotime', isMe: true }, { name: 'Pakitou' }],
  legsByPlayer: [
    [
      mockLeg([100, 85, 60, 140, 45, 41, 20, 10], { won: true, dartsToFinish: 2, doubles: 4 }),
      mockLeg([60, 81, 45, 100, 26, 'B', 0], { doubles: 3 }),
      mockLeg([180, 140, 60, 81, 40], { won: true, dartsToFinish: 1, doubles: 1 }),
    ],
    [
      mockLeg([45, 60, 41, 26, 85, 100, 60, 'B'], { doubles: 2 }),
      mockLeg([60, 100, 81, 140, 60, 40, 20], { won: true, dartsToFinish: 3, doubles: 2 }),
      mockLeg([41, 60, 85, 100], { doubles: 0 }),
    ],
  ],
})
const seg    = (label) => ALL_SEGMENTS.find(s => s.label === label)
const aimed  = (target, hit) => ({ ...seg(hit), target: seg(target) })
const volley = (darts) => ({ darts, bust: false, score: darts.reduce((sum, d) => sum + d.pts, 0) })
const mockCheckoutAnalysis = analyzeLegs([
  { volleys: [
    volley([aimed('T20', 'T20'), aimed('T20', '20'), aimed('T20', 'T18')]),
    volley([aimed('D18', '18'), aimed('D9', 'D9')]),
  ] },
  { volleys: [
    volley([aimed('T20', 'T20'), aimed('T20', 'T20'), aimed('Bull', 'Outer')]),
    volley([aimed('D8', '9'), aimed('D8', '8'), aimed('D4', 'D4')]),
  ] },
], 170)

// --- Preview StatsSessionDetail : match X01 joué dans le championnat fictif ---
const showTournamentSessionPreview = ref(false)
const mockTournamentSession = {
  id: 'mock-session', played_at: '2026-10-12T19:30:00Z', start_score: 501, legs_played: 3,
  tournament_id: mockChampionshipOngoing.tournament.id,
  tournaments: { name: mockChampionshipOngoing.tournament.name, format: 'championship' },
  match_stats: mockMatchStats,
  settings: { legsToWin: 2, humanName: 'Theotime', humanLegsWon: 2, opponents: [{ name: 'Pakitou', legsWon: 1 }] },
}
function openMockSessionTournament() {
  showTournamentSessionPreview.value   = false
  showChampionshipOngoingPreview.value = true
}

// --- Preview StatsWarmupDetailView ---
const showWarmupDetailPreview = ref(false)
const D16 = { sector: 16, type: 'D' }
const T20 = { sector: 20, type: 'T' }
const mockWarmupSessions = [
  { id: '1', played_at: '2025-11-02T10:00:00Z', accuracy: 55, total_darts: 20, hits: 11, duration_s: 300, settings: { zoneRecap: [{ zones: [D16], total: 20, hits: 9, accuracy: 45, durationMs: 300000 }] } },
  { id: '2', played_at: '2026-01-05T10:00:00Z', accuracy: 62, total_darts: 40, hits: 25, duration_s: 480, settings: { points: 1164, bestStreak: 5, zoneRecap: [{ zones: [D16], total: 20, hits: 12, accuracy: 60, durationMs: 240000, points: 384, bestStreak: 4 }, { zones: [T20], total: 20, hits: 13, accuracy: 65, durationMs: 240000, points: 780, bestStreak: 5 }] } },
  { id: '3', played_at: '2026-02-12T10:00:00Z', accuracy: 68, total_darts: 30, hits: 21, duration_s: 360, settings: { zoneRecap: [{ zones: [T20], total: 30, hits: 21, accuracy: 70, durationMs: 360000 }] } },
  { id: '4', played_at: '2026-03-20T10:00:00Z', accuracy: 71, total_darts: 30, hits: 21, duration_s: 360, settings: { zoneRecap: [{ zones: [D16], total: 30, hits: 21, accuracy: 70, durationMs: 360000 }] } },
  { id: '5', played_at: '2026-07-01T09:00:00Z', accuracy: 80, total_darts: 40, hits: 33, duration_s: 420, settings: { points: 1608, bestStreak: 9, zoneRecap: [{ zones: [D16, T20], total: 40, hits: 33, accuracy: 82, durationMs: 420000, points: 1608, bestStreak: 9 }] } },
  { id: '6', played_at: '2026-07-01T18:30:00Z', accuracy: 58, total_darts: 25, hits: 15, duration_s: 300, settings: { zoneRecap: [{ zones: [T20], total: 25, hits: 15, accuracy: 60, durationMs: 300000 }] } },
]

// --- Overlays / modals ---
const unlockBadges        = ref([])
const showBadgeDetail     = ref(false)
const badgeDetail         = ref(null)
const badgeProgress       = ref(null)
const showGameOver        = ref(false)
const showGameMenu        = ref(false)
const showEmailModal      = ref(false)
const showPasswordModal   = ref(false)
const showDoublesModal    = ref(false)
const showCheckoutModal   = ref(false)

// Mock data
const mockBadge = { ...BADGES[0], unlockedAt: new Date().toISOString() }
const mockLockedBadge = BADGES.find(b => b.id === 'darts_1000') ?? BADGES[6]
const mockProgress = { current: 430, target: 1000, suffix: '' }

function showUnlockOne() {
  unlockBadges.value = [BADGES[0]]
}
function showUnlockMany() {
  unlockBadges.value = BADGES.slice(0, 3)
}
function openBadgeUnlocked() {
  badgeDetail.value   = mockBadge
  badgeProgress.value = null
  showBadgeDetail.value = true
}
function openBadgeLocked() {
  badgeDetail.value   = { ...mockLockedBadge, unlockedAt: null }
  badgeProgress.value = mockProgress
  showBadgeDetail.value = true
}

// --- Vues plein écran ---
const views = [
  { name: 'home',           label: 'Home' },
  { name: 'play',           label: 'Lobby (Jouer)' },
  { name: 'stats',          label: 'Stats' },
  { name: 'stats-warmup-detail', label: 'Stats — Détail échauffement' },
  { name: 'profile',        label: 'Profil' },
  { name: 'profile-edit',   label: 'Édition profil' },
  { name: 'badges',         label: 'Badges' },
  { name: 'friends',        label: 'Amis' },
  { name: 'score-settings', label: 'Réglages Score' },
  { name: 'warmup-settings',label: 'Réglages Warmup' },
  { name: 'checkout-settings', label: 'Réglages Checkouts' },
  { name: 'checkout-wiki', label: 'Wiki Checkouts' },
  { name: 'checkout-wiki-detail', label: 'Wiki Checkout — Détail', params: { score: 170 } },
  { name: 'x01-settings',  label: 'Réglages 501' },
  { name: 'x01-starter',   label: 'Partie 501 — Qui commence' },
  { name: 'x01-game',      label: 'Partie 501' },
  { name: 'online-settings', label: '501 en ligne — Réglages' },
  { name: 'tactics-settings', label: 'Réglages Tactics' },
  { name: 'tactics-starter',  label: 'Partie Tactics — Qui commence' },
  { name: 'tactics-game',     label: 'Partie Tactics' },
  { name: 'tournaments',        label: 'Tournois — Liste' },
  { name: 'tournament-settings', label: 'Tournois — Création' },
  { name: 'login',          label: 'Login' },
  { name: 'register',       label: 'Register' },
]

// --- Mock data FriendsView ---
const mockFriends = [
  { friendshipId: '1', id: 'u1', first_name: 'Lucas',  username: 'luca92',   friend_code: 'DMC-A4X7' },
  { friendshipId: '2', id: 'u2', first_name: null,      username: 'dartking', friend_code: 'DMC-B8K2' },
]
const mockReceived = [
  { friendshipId: '3', id: 'u3', first_name: 'Emma',   username: 'emma_d',   friend_code: 'DMC-C1Z9' },
]
const mockSent = [
  { friendshipId: '4', id: 'u4', first_name: null,      username: 'pro180',   friend_code: 'DMC-D5P3' },
]
</script>

<template>
  <div class="dev">
    <h1 class="dev__title">🛠 Dev Playground</h1>

    <!-- Overlays / Modals -->
    <section class="dev__section">
      <h2 class="dev__section-title">Overlays & Modals</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showUnlockOne">Badge débloqué (1)</button>
        <button class="dev__btn" @click="showUnlockMany">Badges débloqués (3)</button>
        <button class="dev__btn" @click="openBadgeUnlocked">Détail badge (débloqué)</button>
        <button class="dev__btn" @click="openBadgeLocked">Détail badge (verrouillé + progression)</button>
        <button class="dev__btn" @click="showGameOver = true">Game Over</button>
        <button class="dev__btn" @click="showGameMenu = true">Menu de partie</button>
        <button class="dev__btn" @click="showEmailModal = true">Changer email</button>
        <button class="dev__btn" @click="showPasswordModal = true">Changer mot de passe</button>
        <button class="dev__btn" @click="showDoublesModal = true">X01 — Doubles tentés</button>
        <button class="dev__btn" @click="showCheckoutModal = true">X01 — Checkout</button>
      </div>
    </section>

    <!-- Vues -->
    <section class="dev__section">
      <h2 class="dev__section-title">Vues</h2>
      <div class="dev__buttons">
        <button
          v-for="v in views"
          :key="v.name"
          class="dev__btn"
          @click="router.push({ name: v.name, params: v.params })"
        >
          {{ v.label }}
        </button>
      </div>
    </section>

    <!-- FriendsView — aperçu plein écran avec données fictives -->
    <section class="dev__section">
      <h2 class="dev__section-title">Vue Amis (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showFriendsPreview = true">Ouvrir la vue Amis</button>
      </div>
    </section>

    <!-- TournamentView — aperçu plein écran avec données fictives -->
    <section class="dev__section">
      <h2 class="dev__section-title">Vue Tournoi — bracket (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showTournamentByesPreview = true">Bracket 5 joueurs (avec byes)</button>
        <button class="dev__btn" @click="showTournamentDoubleElimPreview = true">Bracket 4 joueurs (double élimination)</button>
        <button class="dev__btn" @click="showChampionshipOngoingPreview = true">Championnat 9 joueurs aller-retour en cours (18 journées, exempts, top 4)</button>
        <button class="dev__btn" @click="showChampionshipPlayoffsPreview = true">Championnat 4 joueurs aller-retour + finale</button>
        <button class="dev__btn" @click="showTournamentPendingPreview = true">Tournoi pas démarré (Infos/Participants)</button>
        <button class="dev__btn" @click="showTournamentJoinPreview = true">Page "Rejoindre par code"</button>
        <button class="dev__btn" @click="openMockTournamentMatch">Match tournoi (bouton "Retour au bracket")</button>
      </div>
    </section>

    <!-- OnlineMatchLobbyView — aperçu plein écran avec données fictives -->
    <section class="dev__section">
      <h2 class="dev__section-title">Match en ligne — salle d'attente (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="onlineLobbyPreview = { match: mockOnlineMatch('invited'), myId: 'me' }">Invitation envoyée (hôte)</button>
        <button class="dev__btn" @click="onlineLobbyPreview = { match: mockOnlineMatch('invited'), myId: 'u1' }">Invitation reçue (invité)</button>
        <button class="dev__btn" @click="onlineLobbyPreview = { match: mockOnlineMatch('accepted'), myId: 'me' }">Bull — choix du premier joueur (hôte)</button>
        <button class="dev__btn" @click="onlineLobbyPreview = { match: mockOnlineMatch('accepted'), myId: 'u1' }">Bull — attente (invité)</button>
        <button class="dev__btn" @click="onlineLobbyPreview = { match: mockOnlineMatch('declined'), myId: 'me' }">Invitation refusée</button>
      </div>
    </section>

    <!-- Tactics — parties avec données fictives (preview) -->
    <section class="dev__section">
      <h2 class="dev__section-title">Tactics — parties avec données fictives (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="openMockTacticsGame({ playerCount: 2 })">Partie Tactics — 2 joueurs</button>
        <button class="dev__btn" @click="openMockTacticsGame({ playerCount: 3 })">Partie Tactics — 3 joueurs</button>
        <button class="dev__btn" @click="openMockTacticsGame({ playerCount: 4 })">Partie Tactics — 4 joueurs</button>
        <button class="dev__btn" @click="openMockTacticsGame({ playerCount: 1 })">Partie Tactics — Solo</button>
      </div>
    </section>

    <!-- Checkouts — parties preview -->
    <section class="dev__section">
      <h2 class="dev__section-title">Checkouts — preview</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="openMockCheckoutGame('review')">Checkouts — révision libre</button>
        <button class="dev__btn" @click="openMockCheckoutGame('quiz')">Checkouts — quiz noté</button>
      </div>
    </section>

    <!-- SvgDartboard — aperçu plein écran -->
    <section class="dev__section">
      <h2 class="dev__section-title">Cible SVG (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showDartboardPreview = true">Ouvrir la cible</button>
      </div>
    </section>

    <!-- GameInput — aperçu plein écran (popover de sélection de mode) -->
    <section class="dev__section">
      <h2 class="dev__section-title">Saisie de partie — GameInput (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showGameInputPreview = true">Ouvrir la saisie</button>
      </div>
    </section>

    <!-- X01CheckoutReview — revue des checkouts avec données fictives -->
    <section class="dev__section">
      <h2 class="dev__section-title">X01 — Revue des checkouts (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showCheckoutReviewPreview = true">Ouvrir la revue</button>
      </div>
    </section>

    <!-- X01Result — stats de fin de match avec données fictives -->
    <section class="dev__section">
      <h2 class="dev__section-title">X01 — Stats de fin de match (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showX01ResultPreview = true">Ouvrir le résultat</button>
      </div>
    </section>

    <section class="dev__section">
      <h2 class="dev__section-title">Stats — Détail match X01 de tournoi (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showTournamentSessionPreview = true">Ouvrir le détail (badge → championnat fictif)</button>
      </div>
    </section>

    <!-- StatsWarmupDetailView — aperçu plein écran avec données fictives -->
    <section class="dev__section">
      <h2 class="dev__section-title">Stats — Détail échauffement (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showWarmupDetailPreview = true">Ouvrir la vue Détail échauffement</button>
      </div>
    </section>

    <!-- Game Over en aperçu (a besoin d'un conteneur) -->
    <div v-if="showGameOver" class="dev__gameover-preview">
      <GameOver :correct-count="14" :max-questions="20" :best="9"
        @replay="showGameOver = false" @home="showGameOver = false" />
    </div>

    <!-- Composants montés -->
    <BadgeUnlockOverlay :badges="unlockBadges" @done="unlockBadges = []" />
    <BadgeDetailModal :show="showBadgeDetail" :badge="badgeDetail" :progress="badgeProgress"
      @close="showBadgeDetail = false" />
    <GameMenuModal :show="showGameMenu" @close="showGameMenu = false"
      @finish="showGameMenu = false" @quit="showGameMenu = false" />
    <ChangeEmailModal :show="showEmailModal" current-email="test@exemple.com"
      @close="showEmailModal = false" @save="showEmailModal = false" />
    <ChangePasswordModal :show="showPasswordModal"
      @close="showPasswordModal = false" @save="showPasswordModal = false" />
    <X01DoublesModal :show="showDoublesModal" @confirm="showDoublesModal = false" />
    <X01CheckoutModal :show="showCheckoutModal" :default-darts="2" :checkout-score="40"
      @confirm="showCheckoutModal = false" />

    <!-- FriendsView plein écran -->
    <div v-if="showFriendsPreview" class="dev__fullscreen-preview">
      <FriendsView
        :mock-friends="mockFriends"
        :mock-received="mockReceived"
        :mock-sent="mockSent"
        :mock-friend-code="'DMC-X7K2'"
      />
      <button class="dev__close-preview" @click="showFriendsPreview = false">✕ Fermer</button>
    </div>

    <!-- SvgDartboard plein écran -->
    <div v-if="showDartboardPreview" class="dev__fullscreen-preview dev__dartboard-preview">
      <SvgDartboard zoomable @dart="lastDart = $event" />
      <pre class="dev__dartboard-log">{{ lastDart ? JSON.stringify(lastDart) : 'Tape une zone…' }}</pre>
      <button class="dev__close-preview" @click="showDartboardPreview = false">✕ Fermer</button>
    </div>

    <!-- GameInput plein écran -->
    <div v-if="showGameInputPreview" class="dev__fullscreen-preview dev__gameinput-preview">
      <GameInput
        :darts="mockDarts"
        toggleable
        @dart="onMockDart"
        @miss="onMockDart({ type: 'miss', sector: null, pts: 0, label: 'Miss' })"
        @undo="mockDarts = mockDarts.slice(0, -1)"
      />
      <button class="dev__close-preview" @click="showGameInputPreview = false">✕ Fermer</button>
    </div>

    <div v-if="showX01ResultPreview" class="dev__fullscreen-preview dev__gameinput-preview">
      <X01Result
        :match-stats="mockMatchStats"
        subtitle="501 pts · 3 manches"
        :checkout-analysis="mockCheckoutAnalysis"
        hide-actions
      />
      <button class="dev__close-preview" @click="showX01ResultPreview = false">✕ Fermer</button>
    </div>

    <!-- StatsWarmupDetailView plein écran -->
    <div v-if="showCheckoutReviewPreview" class="dev__fullscreen-preview dev__gameinput-preview">
      <X01CheckoutReview :analysis="mockCheckoutAnalysis" />
      <button class="dev__close-preview" @click="showCheckoutReviewPreview = false">✕ Fermer</button>
    </div>

    <!-- Overlay fixed avec son propre bouton retour -->
    <StatsSessionDetail
      :show="showTournamentSessionPreview"
      :session="mockTournamentSession"
      mode="x01"
      @close="showTournamentSessionPreview = false"
      @open-tournament="openMockSessionTournament"
    />

    <div v-if="showWarmupDetailPreview" class="dev__fullscreen-preview">
      <StatsWarmupDetailView :mock-sessions="mockWarmupSessions" />
      <button class="dev__close-preview" @click="showWarmupDetailPreview = false">✕ Fermer</button>
    </div>

    <!-- TournamentView plein écran (byes) -->
    <div v-if="showTournamentByesPreview" class="dev__fullscreen-preview">
      <TournamentView :mock-tournament="mockTournamentByes" />
      <button class="dev__close-preview" @click="showTournamentByesPreview = false">✕ Fermer</button>
    </div>

    <!-- TournamentView plein écran (double élimination) -->
    <div v-if="showTournamentDoubleElimPreview" class="dev__fullscreen-preview">
      <TournamentView :mock-tournament="mockTournamentDoubleElim" />
      <button class="dev__close-preview" @click="showTournamentDoubleElimPreview = false">✕ Fermer</button>
    </div>

    <!-- TournamentView plein écran (championnat en cours) -->
    <div v-if="showChampionshipOngoingPreview" class="dev__fullscreen-preview">
      <TournamentView :mock-tournament="mockChampionshipOngoing" />
      <button class="dev__close-preview" @click="showChampionshipOngoingPreview = false">✕ Fermer</button>
    </div>

    <!-- TournamentView plein écran (championnat + playoffs) -->
    <div v-if="showChampionshipPlayoffsPreview" class="dev__fullscreen-preview">
      <TournamentView :mock-tournament="mockChampionshipPlayoffs" />
      <button class="dev__close-preview" @click="showChampionshipPlayoffsPreview = false">✕ Fermer</button>
    </div>

    <!-- TournamentView plein écran (pas démarré) -->
    <div v-if="showTournamentPendingPreview" class="dev__fullscreen-preview">
      <TournamentView :mock-tournament="mockTournamentPending" />
      <button class="dev__close-preview" @click="showTournamentPendingPreview = false">✕ Fermer</button>
    </div>

    <!-- OnlineMatchLobbyView plein écran -->
    <div v-if="onlineLobbyPreview" class="dev__fullscreen-preview">
      <OnlineMatchLobbyView :mock="onlineLobbyPreview" />
      <button class="dev__close-preview" @click="onlineLobbyPreview = null">✕ Fermer</button>
    </div>

    <!-- TournamentJoinView plein écran -->
    <div v-if="showTournamentJoinPreview" class="dev__fullscreen-preview">
      <TournamentJoinView :mock-preview="mockJoinPreview" />
      <button class="dev__close-preview" @click="showTournamentJoinPreview = false">✕ Fermer</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dev {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $gap-xl;

  &__title {
    @include title-xl;
    color: $text-color;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: $gap-xs;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__btn {
    background: rgba(255, 255, 255, 0.06);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    color: $text-color;
    @include text-sm;
    text-align: left;
    transition: background 0.15s;

    &:active { background: rgba(255, 255, 255, 0.12); }
  }

  &__gameover-preview {
    position: fixed;
    inset: 0;
    background: $bg;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    z-index: 90;
  }

  &__fullscreen-preview {
    position: fixed;
    inset: 0;
    background: $bg;
    overflow-y: auto;
    z-index: 90;
  }

  &__gameinput-preview {
    display: flex;
    flex-direction: column;
    padding: $padding-lg $padding-md calc($padding-xxl + 64px);
    gap: $gap-md;
  }

  &__dartboard-preview {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: $gap-lg;
    padding: $padding-lg;
  }

  &__dartboard-log {
    @include text-sm;
    color: $muted;
    font-family: monospace;
  }

  &__close-preview {
    @include title-sm;
    position: fixed;
    bottom: calc($padding-lg + env(safe-area-inset-bottom));
    right: $padding-md;
    background: $orange;
    color: $white;
    padding: $padding-sm $padding-md;
    border-radius: $radius-pill;
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
}
</style>
