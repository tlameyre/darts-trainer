import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase.js'
import { useAuthStore } from './authStore.js'
import { BADGES, getBadge } from '../data/badges.js'

const MIN_VOLLEYS = 5   // min. 5 volées (15 fléchettes) pour les badges de précision

// Badges derived from a single cumulative stat: [stat key in fetchProfileStats, target]
const STAT_THRESHOLDS = {
  x01_first_win: ['x01Wins', 1], x01_wins_10: ['x01Wins', 10], x01_wins_50: ['x01Wins', 50],
  x01_avg_60: ['bestX01Avg', 60], x01_avg_80: ['bestX01Avg', 80], x01_avg_100: ['bestX01Avg', 100],
  x01_finish_100: ['bestX01Finish', 100], x01_nine_darter: ['hasNineDarter', 1],
  checkout_sessions_10: ['checkoutSessionsCount', 10], checkout_sessions_50: ['checkoutSessionsCount', 50],
  checkout_perfect: ['hasPerfectCheckout', 1], checkout_optimal_50: ['checkoutOptimalTotal', 50],
  checkout_170: ['hasCheckout170', 1],
  tournament_played: ['tournamentsPlayed', 1], tournament_won: ['tournamentsWon', 1], tournament_won_3: ['tournamentsWon', 3],
  days_streak_3: ['bestDaysStreak', 3], days_streak_7: ['bestDaysStreak', 7], days_streak_30: ['bestDaysStreak', 30],
  week_5_sessions: ['maxSessionsWeek', 5],
}

function statValue(stats, key) {
  return Number(stats?.[key] ?? 0)
}

// Tournament results come from the server, not from deleted sessions, so they are never revoked
const isSessionDerived = id => !id.startsWith('tournament_')

function newStatBadgeIds(unlocked, stats) {
  return Object.entries(STAT_THRESHOLDS)
    .filter(([id, [key, target]]) => !unlocked.has(id) && statValue(stats, key) >= target)
    .map(([id]) => id)
}

export const useBadgeStore = defineStore('badge', () => {
  function getUser() {
    return useAuthStore().user
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  async function fetchUnlockedIds() {
    const { data } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', getUser().id)
    return new Set((data ?? []).map(r => r.badge_id))
  }

  async function unlockBadges(ids) {
    if (!ids.length) return []
    await supabase.from('user_badges').insert(
      ids.map(badge_id => ({ user_id: getUser().id, badge_id }))
    )
    return ids.map(id => getBadge(id)).filter(Boolean)
  }

  // ── Progression (affichée dans la modale si badge non débloqué) ───────────────

  function getBadgeProgress(badgeId, stats) {
    if (!stats) return null
    const {
      warmupDarts, x01Darts, totalDarts,
      totalSessions, warmupSessionsCount, x01SessionsCount, gameSessionsCount,
      bestAccuracy, bestGameAccuracy, bestStreak, totalCorrect, avgAccuracy10,
      totalQuestions,
    } = stats
    switch (badgeId) {
      // Débuts — first actions
      case 'first_game':    return { current: Math.min(gameSessionsCount, 1),   target: 1, suffix: '' }
      case 'first_warmup':  return { current: Math.min(warmupSessionsCount, 1), target: 1, suffix: '' }
      // Sessions globales
      case 'sessions_10':    return { current: Math.min(totalSessions, 10),    target: 10,    suffix: '' }
      case 'sessions_50':    return { current: Math.min(totalSessions, 50),    target: 50,    suffix: '' }
      case 'sessions_100':   return { current: Math.min(totalSessions, 100),   target: 100,   suffix: '' }
      // Sessions Échauffement
      case 'warmup_sessions_10':  return { current: Math.min(warmupSessionsCount, 10),  target: 10,  suffix: '' }
      case 'warmup_sessions_50':  return { current: Math.min(warmupSessionsCount, 50),  target: 50,  suffix: '' }
      case 'warmup_sessions_100': return { current: Math.min(warmupSessionsCount, 100), target: 100, suffix: '' }
      // Sessions X01
      case 'x01_sessions_10':  return { current: Math.min(x01SessionsCount, 10),  target: 10,  suffix: '' }
      case 'x01_sessions_50':  return { current: Math.min(x01SessionsCount, 50),  target: 50,  suffix: '' }
      case 'x01_sessions_100': return { current: Math.min(x01SessionsCount, 100), target: 100, suffix: '' }
      // Sessions Score Training
      case 'game_sessions_10':  return { current: Math.min(gameSessionsCount, 10),  target: 10,  suffix: '' }
      case 'game_sessions_50':  return { current: Math.min(gameSessionsCount, 50),  target: 50,  suffix: '' }
      case 'game_sessions_100': return { current: Math.min(gameSessionsCount, 100), target: 100, suffix: '' }
      // Fléchettes Échauffement
      case 'darts_100':      return { current: Math.min(warmupDarts, 100),      target: 100,   suffix: '' }
      case 'darts_1000':     return { current: Math.min(warmupDarts, 1000),     target: 1000,  suffix: '' }
      case 'darts_5000':    return { current: Math.min(warmupDarts, 5000),    target: 5000, suffix: '' }
      // Fléchettes X01
      case 'x01_darts_100':   return { current: Math.min(x01Darts, 100),   target: 100,   suffix: '' }
      case 'x01_darts_1000':  return { current: Math.min(x01Darts, 1000),  target: 1000,  suffix: '' }
      case 'x01_darts_5000': return { current: Math.min(x01Darts, 5000), target: 5000, suffix: '' }
      // Fléchettes cumulées
      case 'total_darts_500':   return { current: Math.min(totalDarts, 500),   target: 500,   suffix: '' }
      case 'total_darts_1000':  return { current: Math.min(totalDarts, 1000),  target: 1000,  suffix: '' }
      case 'total_darts_5000': return { current: Math.min(totalDarts, 5000), target: 5000, suffix: '' }
      // Score Training — streaks / correct
      case 'perfect_game':   return { current: Math.min(bestGameAccuracy, 100), target: 100,   suffix: '%' }
      case 'streak_10':      return { current: Math.min(bestStreak, 10),       target: 10,    suffix: '' }
      case 'streak_20':      return { current: Math.min(bestStreak, 20),       target: 20,    suffix: '' }
      case 'streak_50':      return { current: Math.min(bestStreak, 50),       target: 50,    suffix: '' }
      case 'correct_50':    return { current: Math.min(totalCorrect, 50),    target: 50,   suffix: '' }
      case 'correct_100':    return { current: Math.min(totalCorrect, 100),    target: 100,   suffix: '' }
      case 'correct_500':   return { current: Math.min(totalCorrect, 500),   target: 500,  suffix: '' }
      case 'correct_1000':   return { current: Math.min(totalCorrect, 1000),   target: 1000,  suffix: '' }
      // Score Training — questions totales
      case 'questions_50': return { current: Math.min(totalQuestions, 50), target: 50, suffix: '' }
      case 'questions_100': return { current: Math.min(totalQuestions, 100), target: 100, suffix: '' }
      case 'questions_500':   return { current: Math.min(totalQuestions, 500),   target: 500,   suffix: '' }
      case 'questions_1000':  return { current: Math.min(totalQuestions, 1000),  target: 1000,  suffix: '' }
      case 'questions_5000':  return { current: Math.min(totalQuestions, 5000),  target: 5000,  suffix: '' }
      case 'questions_10000': return { current: Math.min(totalQuestions, 10000), target: 10000, suffix: '' }
      // Précision échauffement
      case 'precise':        return { current: Math.round(bestAccuracy),       target: 80,    suffix: '%' }
      case 'sniper':         return { current: Math.round(bestAccuracy),       target: 95,    suffix: '%' }
      case 'perfect_warmup': return { current: Math.round(bestAccuracy),       target: 100,   suffix: '%' }
      case 'avg_80':         return { current: Math.round(avgAccuracy10 ?? 0), target: 80,    suffix: '%' }
      default: {
        const threshold = STAT_THRESHOLDS[badgeId]
        if (!threshold) return null
        const [key, target] = threshold
        return { current: Math.min(Math.floor(statValue(stats, key)), target), target, suffix: '' }
      }
    }
  }

  // ── Checks après session Score Training ───────────────────────────────────────

  async function checkGameBadges({ correctCount, totalQuestions: sessionQuestions, bestStreak, cumulativeStats }) {
    if (!getUser()) return []

    const unlocked = await fetchUnlockedIds()
    const toUnlock = []
    const {
      totalSessions, gameSessionsCount,
      totalDarts, totalCorrect, totalQuestions,
    } = cumulativeStats

    if (!unlocked.has('first_game'))
      toUnlock.push('first_game')

    // Sessions globales
    if (!unlocked.has('sessions_10') && totalSessions >= 10)   toUnlock.push('sessions_10')
    if (!unlocked.has('sessions_50') && totalSessions >= 50)   toUnlock.push('sessions_50')
    if (!unlocked.has('sessions_100') && totalSessions >= 100) toUnlock.push('sessions_100')

    // Sessions Score Training
    if (!unlocked.has('game_sessions_10') && gameSessionsCount >= 10)   toUnlock.push('game_sessions_10')
    if (!unlocked.has('game_sessions_50') && gameSessionsCount >= 50)   toUnlock.push('game_sessions_50')
    if (!unlocked.has('game_sessions_100') && gameSessionsCount >= 100) toUnlock.push('game_sessions_100')

    // Streaks
    if (!unlocked.has('streak_10') && bestStreak >= 10)  toUnlock.push('streak_10')
    if (!unlocked.has('streak_20') && bestStreak >= 20)  toUnlock.push('streak_20')
    if (!unlocked.has('streak_50') && bestStreak >= 50)  toUnlock.push('streak_50')

    if (!unlocked.has('perfect_game') && sessionQuestions >= 10 && correctCount === sessionQuestions)
      toUnlock.push('perfect_game')

    // Questions correctes totales
    if (!unlocked.has('correct_50') && totalCorrect >= 50)   toUnlock.push('correct_50')
    if (!unlocked.has('correct_100') && totalCorrect >= 100)   toUnlock.push('correct_100')
    if (!unlocked.has('correct_500') && totalCorrect >= 500)   toUnlock.push('correct_500')
    if (!unlocked.has('correct_1000') && totalCorrect >= 1000) toUnlock.push('correct_1000')

    // Questions totales
    if (!unlocked.has('questions_50') && totalQuestions >= 50)   toUnlock.push('questions_50')
    if (!unlocked.has('questions_100') && totalQuestions >= 100)   toUnlock.push('questions_100')
    if (!unlocked.has('questions_500') && totalQuestions >= 500)   toUnlock.push('questions_500')
    if (!unlocked.has('questions_1000') && totalQuestions >= 1000)   toUnlock.push('questions_1000')
    if (!unlocked.has('questions_5000') && totalQuestions >= 5000)   toUnlock.push('questions_5000')
    if (!unlocked.has('questions_10000') && totalQuestions >= 10000) toUnlock.push('questions_10000')

    // Fléchettes cumulées
    if (!unlocked.has('total_darts_500') && totalDarts >= 500)   toUnlock.push('total_darts_500')
    if (!unlocked.has('total_darts_1000') && totalDarts >= 1000) toUnlock.push('total_darts_1000')
    if (!unlocked.has('total_darts_5000') && totalDarts >= 5000) toUnlock.push('total_darts_5000')

    return unlockBadges([...toUnlock, ...newStatBadgeIds(unlocked, cumulativeStats)])
  }

  // ── Checks après session Échauffement ────────────────────────────────────────

  async function checkWarmupBadges({ totalDarts: sessionDarts, accuracy, cumulativeStats }) {
    if (!getUser()) return []

    const unlocked = await fetchUnlockedIds()
    const toUnlock = []
    const {
      totalSessions, warmupSessionsCount,
      warmupDarts, totalDarts,
      avg80eligible, avgAccuracy10,
    } = cumulativeStats
    const hasMinVolleys = sessionDarts >= MIN_VOLLEYS * 3

    if (!unlocked.has('first_warmup'))
      toUnlock.push('first_warmup')

    // Sessions globales
    if (!unlocked.has('sessions_10') && totalSessions >= 10)   toUnlock.push('sessions_10')
    if (!unlocked.has('sessions_50') && totalSessions >= 50)   toUnlock.push('sessions_50')
    if (!unlocked.has('sessions_100') && totalSessions >= 100) toUnlock.push('sessions_100')

    // Sessions Échauffement
    if (!unlocked.has('warmup_sessions_10') && warmupSessionsCount >= 10)   toUnlock.push('warmup_sessions_10')
    if (!unlocked.has('warmup_sessions_50') && warmupSessionsCount >= 50)   toUnlock.push('warmup_sessions_50')
    if (!unlocked.has('warmup_sessions_100') && warmupSessionsCount >= 100) toUnlock.push('warmup_sessions_100')

    // Fléchettes Échauffement
    if (!unlocked.has('darts_100') && warmupDarts >= 100)   toUnlock.push('darts_100')
    if (!unlocked.has('darts_1000') && warmupDarts >= 1000) toUnlock.push('darts_1000')
    if (!unlocked.has('darts_5000') && warmupDarts >= 5000) toUnlock.push('darts_5000')

    // Fléchettes cumulées
    if (!unlocked.has('total_darts_500') && totalDarts >= 500)   toUnlock.push('total_darts_500')
    if (!unlocked.has('total_darts_1000') && totalDarts >= 1000) toUnlock.push('total_darts_1000')
    if (!unlocked.has('total_darts_5000') && totalDarts >= 5000) toUnlock.push('total_darts_5000')

    if (hasMinVolleys) {
      if (!unlocked.has('precise') && accuracy >= 80)        toUnlock.push('precise')
      if (!unlocked.has('sniper') && accuracy >= 95)         toUnlock.push('sniper')
      if (!unlocked.has('perfect_warmup') && accuracy >= 100) toUnlock.push('perfect_warmup')
    }

    if (!unlocked.has('avg_80') && avg80eligible && avgAccuracy10 >= 80)
      toUnlock.push('avg_80')

    return unlockBadges([...toUnlock, ...newStatBadgeIds(unlocked, cumulativeStats)])
  }

  // ── Checks après session X01 ─────────────────────────────────────────────────

  async function checkX01Badges(cumulativeStats) {
    if (!getUser()) return []

    const unlocked = await fetchUnlockedIds()
    const toUnlock = []
    const { totalSessions, x01SessionsCount, x01Darts, totalDarts } = cumulativeStats

    // Sessions globales
    if (!unlocked.has('sessions_10') && totalSessions >= 10)   toUnlock.push('sessions_10')
    if (!unlocked.has('sessions_50') && totalSessions >= 50)   toUnlock.push('sessions_50')
    if (!unlocked.has('sessions_100') && totalSessions >= 100) toUnlock.push('sessions_100')

    // Sessions X01
    if (!unlocked.has('x01_sessions_10') && x01SessionsCount >= 10)   toUnlock.push('x01_sessions_10')
    if (!unlocked.has('x01_sessions_50') && x01SessionsCount >= 50)   toUnlock.push('x01_sessions_50')
    if (!unlocked.has('x01_sessions_100') && x01SessionsCount >= 100) toUnlock.push('x01_sessions_100')

    // Fléchettes X01
    if (!unlocked.has('x01_darts_100') && x01Darts >= 100)   toUnlock.push('x01_darts_100')
    if (!unlocked.has('x01_darts_1000') && x01Darts >= 1000) toUnlock.push('x01_darts_1000')
    if (!unlocked.has('x01_darts_5000') && x01Darts >= 5000) toUnlock.push('x01_darts_5000')

    // Fléchettes cumulées
    if (!unlocked.has('total_darts_500') && totalDarts >= 500)   toUnlock.push('total_darts_500')
    if (!unlocked.has('total_darts_1000') && totalDarts >= 1000) toUnlock.push('total_darts_1000')
    if (!unlocked.has('total_darts_5000') && totalDarts >= 5000) toUnlock.push('total_darts_5000')

    return unlockBadges([...toUnlock, ...newStatBadgeIds(unlocked, cumulativeStats)])
  }

  // ── Checks après session Checkout ────────────────────────────────────────────

  async function checkCheckoutBadges(cumulativeStats) {
    if (!getUser()) return []

    const unlocked = await fetchUnlockedIds()
    const { totalSessions } = cumulativeStats
    const toUnlock = [
      ['sessions_10', 10], ['sessions_50', 50], ['sessions_100', 100],
    ].filter(([id, target]) => !unlocked.has(id) && totalSessions >= target).map(([id]) => id)

    return unlockBadges([...toUnlock, ...newStatBadgeIds(unlocked, cumulativeStats)])
  }

  // ── Check tournois (résultat calculé côté serveur) ───────────────────────────

  async function checkTournamentBadges(cumulativeStats) {
    if (!getUser()) return []
    const unlocked = await fetchUnlockedIds()
    return unlockBadges(newStatBadgeIds(unlocked, cumulativeStats))
  }

  // ── Rattrapage : stat déjà au seuil mais badge jamais débloqué ───────────────

  async function syncStatBadges(stats) {
    if (!getUser()) return []
    const unlocked = await fetchUnlockedIds()
    return unlockBadges(newStatBadgeIds(unlocked, stats))
  }

  // ── Checks en temps réel (lancers spéciaux) ───────────────────────────────────

  async function checkSpecialThrow(darts, volleyScore = null) {
    if (!getUser()) return []

    const unlocked = await fetchUnlockedIds()
    const toUnlock = []

    if (darts.length >= 3) {
      const last3 = darts.slice(-3)

      // 180 — T20 + T20 + T20
      if (!unlocked.has('one_eighty')) {
        const is180 = last3.every(d => d.type === 'triple' && d.sector === 20)
        if (is180) toUnlock.push('one_eighty')
      }

      // Hat Trick — 3 bulls (type bull, pts 25 ou 50)
      if (!unlocked.has('hat_trick')) {
        const isHat = last3.every(d => d.type === 'bull')
        if (isHat) toUnlock.push('hat_trick')
      }

      // White Horse — 3 triples dans 3 secteurs DIFFÉRENTS
      if (!unlocked.has('white_horse')) {
        const triples = last3.filter(d => d.type === 'triple')
        if (triples.length === 3) {
          const sectors = new Set(triples.map(d => d.sector))
          if (sectors.size === 3) toUnlock.push('white_horse')
        }
      }

      // Bullseye — double bull (50 pts)
      if (!unlocked.has('bullseye')) {
        const hasBull50 = last3.some(d => d.type === 'bull' && d.pts === 50)
        if (hasBull50) toUnlock.push('bullseye')
      }

      // Big Fish — 170 (T20 + T20 + Bull)
      if (!unlocked.has('big_fish')) {
        const sum = last3.reduce((s, d) => s + d.pts, 0)
        if (sum === 170 && last3.every(d => d.type !== 'miss')) toUnlock.push('big_fish')
      }

      // Shanghai — single + double + triple du même secteur
      if (!unlocked.has('shanghai')) {
        const types   = new Set(last3.map(d => d.type))
        const sectors = last3.map(d => d.sector)
        if (
          types.has('single') && types.has('double') && types.has('triple') &&
          sectors.every(s => s !== null && s === sectors[0])
        ) toUnlock.push('shanghai')
      }
    }

    // Score-only check — X01 mode saisie totale (pas de détail par fléchette)
    if (volleyScore !== null && !unlocked.has('big_fish') && volleyScore === 170)
      toUnlock.push('big_fish')

    return unlockBadges(toUnlock)
  }

  // ── Révocation des badges volume si seuil plus atteint ───────────────────────

  async function revokeVolumeBadges(cumulativeStats) {
    if (!getUser()) return
    const {
      totalSessions, warmupSessionsCount, x01SessionsCount, gameSessionsCount,
      warmupDarts, x01Darts, totalDarts,
      totalCorrect, totalQuestions,
    } = cumulativeStats

    const unlocked = await fetchUnlockedIds()
    const toRevoke = []

    // Sessions globales
    if (unlocked.has('sessions_100') && totalSessions < 100) toRevoke.push('sessions_100')
    if (unlocked.has('sessions_50')  && totalSessions < 50)  toRevoke.push('sessions_50')
    if (unlocked.has('sessions_10')  && totalSessions < 10)  toRevoke.push('sessions_10')
    // Sessions Échauffement
    if (unlocked.has('warmup_sessions_100') && warmupSessionsCount < 100) toRevoke.push('warmup_sessions_100')
    if (unlocked.has('warmup_sessions_50')  && warmupSessionsCount < 50)  toRevoke.push('warmup_sessions_50')
    if (unlocked.has('warmup_sessions_10')  && warmupSessionsCount < 10)  toRevoke.push('warmup_sessions_10')
    // Sessions X01
    if (unlocked.has('x01_sessions_100') && x01SessionsCount < 100) toRevoke.push('x01_sessions_100')
    if (unlocked.has('x01_sessions_50')  && x01SessionsCount < 50)  toRevoke.push('x01_sessions_50')
    if (unlocked.has('x01_sessions_10')  && x01SessionsCount < 10)  toRevoke.push('x01_sessions_10')
    // Sessions Math Trainer
    if (unlocked.has('game_sessions_100') && gameSessionsCount < 100) toRevoke.push('game_sessions_100')
    if (unlocked.has('game_sessions_50')  && gameSessionsCount < 50)  toRevoke.push('game_sessions_50')
    if (unlocked.has('game_sessions_10')  && gameSessionsCount < 10)  toRevoke.push('game_sessions_10')
    // Fléchettes Échauffement
    if (unlocked.has('darts_5000') && warmupDarts < 5000) toRevoke.push('darts_5000')
    if (unlocked.has('darts_1000') && warmupDarts < 1000) toRevoke.push('darts_1000')
    if (unlocked.has('darts_100')  && warmupDarts < 100)  toRevoke.push('darts_100')
    // Fléchettes X01
    if (unlocked.has('x01_darts_5000') && x01Darts < 5000) toRevoke.push('x01_darts_5000')
    if (unlocked.has('x01_darts_1000') && x01Darts < 1000) toRevoke.push('x01_darts_1000')
    if (unlocked.has('x01_darts_100')  && x01Darts < 100)  toRevoke.push('x01_darts_100')
    // Fléchettes cumulées
    if (unlocked.has('total_darts_5000') && totalDarts < 5000) toRevoke.push('total_darts_5000')
    if (unlocked.has('total_darts_1000') && totalDarts < 1000) toRevoke.push('total_darts_1000')
    if (unlocked.has('total_darts_500')  && totalDarts < 500)  toRevoke.push('total_darts_500')
    // Bonnes réponses
    if (unlocked.has('correct_1000') && totalCorrect < 1000) toRevoke.push('correct_1000')
    if (unlocked.has('correct_500')  && totalCorrect < 500)  toRevoke.push('correct_500')
    if (unlocked.has('correct_100')  && totalCorrect < 100)  toRevoke.push('correct_100')
    if (unlocked.has('correct_50')   && totalCorrect < 50)   toRevoke.push('correct_50')
    // Questions totales
    if (unlocked.has('questions_10000') && totalQuestions < 10000) toRevoke.push('questions_10000')
    if (unlocked.has('questions_5000')  && totalQuestions < 5000)  toRevoke.push('questions_5000')
    if (unlocked.has('questions_1000')  && totalQuestions < 1000)  toRevoke.push('questions_1000')
    if (unlocked.has('questions_500')   && totalQuestions < 500)   toRevoke.push('questions_500')
    if (unlocked.has('questions_100')   && totalQuestions < 100)   toRevoke.push('questions_100')
    if (unlocked.has('questions_50')    && totalQuestions < 50)    toRevoke.push('questions_50')

    Object.entries(STAT_THRESHOLDS).forEach(([id, [key, target]]) => {
      if (isSessionDerived(id) && unlocked.has(id) && statValue(cumulativeStats, key) < target) toRevoke.push(id)
    })

    if (!toRevoke.length) return

    await supabase.from('user_badges')
      .delete()
      .eq('user_id', getUser().id)
      .in('badge_id', toRevoke)
  }

  // ── Check profil complété ─────────────────────────────────────────────────────

  async function checkProfileBadge(profile) {
    if (!getUser()) return []
    const unlocked = await fetchUnlockedIds()
    if (unlocked.has('profile_complete')) return []
    const hasInfo = profile?.first_name || profile?.last_name || profile?.username
    if (!hasInfo) return []
    return unlockBadges(['profile_complete'])
  }

  // ── Fetch tous les badges utilisateur ────────────────────────────────────────

  async function fetchUserBadges() {
    if (!getUser()) return []
    const { data } = await supabase
      .from('user_badges')
      .select('badge_id, unlocked_at')
      .eq('user_id', getUser().id)
      .order('unlocked_at', { ascending: false })
    return (data ?? []).map(r => ({
      ...getBadge(r.badge_id),
      unlockedAt: r.unlocked_at,
    })).filter(b => b.id)
  }

  return {
    getBadgeProgress,
    checkGameBadges, checkWarmupBadges, checkX01Badges, checkCheckoutBadges, checkTournamentBadges,
    checkSpecialThrow, checkProfileBadge,
    syncStatBadges, revokeVolumeBadges,
    fetchUserBadges,
  }
})
