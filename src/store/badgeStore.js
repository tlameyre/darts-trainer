import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase.js'
import { useAuthStore } from './authStore.js'
import { BADGES, getBadge } from '../data/badges.js'

const MIN_VOLLEYS = 5   // min. 5 volées (15 fléchettes) pour les badges de précision

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
    const { totalDarts, totalSessions, bestAccuracy, bestStreak, totalCorrect, avgAccuracy10 } = stats
    switch (badgeId) {
      case 'sessions_10':    return { current: Math.min(totalSessions, 10),    target: 10,    suffix: '' }
      case 'sessions_50':    return { current: Math.min(totalSessions, 50),    target: 50,    suffix: '' }
      case 'sessions_100':   return { current: Math.min(totalSessions, 100),   target: 100,   suffix: '' }
      case 'darts_100':      return { current: Math.min(totalDarts, 100),      target: 100,   suffix: '' }
      case 'darts_1000':     return { current: Math.min(totalDarts, 1000),     target: 1000,  suffix: '' }
      case 'darts_10000':    return { current: Math.min(totalDarts, 10000),    target: 10000, suffix: '' }
      case 'streak_10':      return { current: Math.min(bestStreak, 10),       target: 10,    suffix: '' }
      case 'streak_20':      return { current: Math.min(bestStreak, 20),       target: 20,    suffix: '' }
      case 'streak_50':      return { current: Math.min(bestStreak, 50),       target: 50,    suffix: '' }
      case 'correct_500':    return { current: Math.min(totalCorrect, 500),    target: 500,   suffix: '' }
      case 'correct_2000':   return { current: Math.min(totalCorrect, 2000),   target: 2000,  suffix: '' }
      case 'precise':        return { current: Math.round(bestAccuracy),       target: 80,    suffix: '%' }
      case 'sniper':         return { current: Math.round(bestAccuracy),       target: 95,    suffix: '%' }
      case 'perfect_warmup': return { current: Math.round(bestAccuracy),       target: 100,   suffix: '%' }
      case 'avg_80':         return { current: Math.round(avgAccuracy10 ?? 0), target: 80,    suffix: '%' }
      default:               return null
    }
  }

  // ── Checks après session Score Training ───────────────────────────────────────

  async function checkGameBadges({ correctCount, totalQuestions, bestStreak, cumulativeStats }) {
    if (!getUser()) return []

    const unlocked = await fetchUnlockedIds()
    const toUnlock = []
    const { totalSessions, totalCorrect } = cumulativeStats

    if (!unlocked.has('first_game'))
      toUnlock.push('first_game')

    if (!unlocked.has('sessions_10') && totalSessions >= 10)
      toUnlock.push('sessions_10')
    if (!unlocked.has('sessions_50') && totalSessions >= 50)
      toUnlock.push('sessions_50')
    if (!unlocked.has('sessions_100') && totalSessions >= 100)
      toUnlock.push('sessions_100')

    if (!unlocked.has('streak_10') && bestStreak >= 10)
      toUnlock.push('streak_10')
    if (!unlocked.has('streak_20') && bestStreak >= 20)
      toUnlock.push('streak_20')
    if (!unlocked.has('streak_50') && bestStreak >= 50)
      toUnlock.push('streak_50')

    if (!unlocked.has('perfect_game') && totalQuestions >= 10 && correctCount === totalQuestions)
      toUnlock.push('perfect_game')

    if (!unlocked.has('correct_500') && totalCorrect >= 500)
      toUnlock.push('correct_500')
    if (!unlocked.has('correct_2000') && totalCorrect >= 2000)
      toUnlock.push('correct_2000')

    return unlockBadges(toUnlock)
  }

  // ── Checks après session Échauffement ────────────────────────────────────────

  async function checkWarmupBadges({ totalDarts, accuracy, cumulativeStats }) {
    if (!getUser()) return []

    const unlocked = await fetchUnlockedIds()
    const toUnlock = []
    const { totalSessions, totalDarts: cumDarts, avg80eligible, avgAccuracy10 } = cumulativeStats
    const hasMinVolleys = totalDarts >= MIN_VOLLEYS * 3

    if (!unlocked.has('first_warmup'))
      toUnlock.push('first_warmup')

    if (!unlocked.has('sessions_10') && totalSessions >= 10)
      toUnlock.push('sessions_10')
    if (!unlocked.has('sessions_50') && totalSessions >= 50)
      toUnlock.push('sessions_50')
    if (!unlocked.has('sessions_100') && totalSessions >= 100)
      toUnlock.push('sessions_100')

    if (!unlocked.has('darts_100') && cumDarts >= 100)
      toUnlock.push('darts_100')
    if (!unlocked.has('darts_1000') && cumDarts >= 1000)
      toUnlock.push('darts_1000')
    if (!unlocked.has('darts_10000') && cumDarts >= 10000)
      toUnlock.push('darts_10000')

    if (hasMinVolleys) {
      if (!unlocked.has('precise') && accuracy >= 80)
        toUnlock.push('precise')
      if (!unlocked.has('sniper') && accuracy >= 95)
        toUnlock.push('sniper')
      if (!unlocked.has('perfect_warmup') && accuracy >= 100)
        toUnlock.push('perfect_warmup')
    }

    if (!unlocked.has('avg_80') && avg80eligible && avgAccuracy10 >= 80)
      toUnlock.push('avg_80')

    return unlockBadges(toUnlock)
  }

  // ── Checks en temps réel (lancers spéciaux, appelé dans WarmupGameView) ───────

  async function checkSpecialThrow(darts) {
    if (!getUser() || darts.length < 3) return []

    const last3    = darts.slice(-3)
    const unlocked = await fetchUnlockedIds()
    const toUnlock = []

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

    return unlockBadges(toUnlock)
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
    checkGameBadges, checkWarmupBadges, checkSpecialThrow, checkProfileBadge,
    fetchUserBadges,
  }
})
