import { supabase } from '../lib/supabase.js'
import { user } from './authStore.js'
import { BADGES, getBadge } from '../data/badges.js'

// Récupère les IDs des badges déjà débloqués
async function fetchUnlockedIds() {
  const { data } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.value.id)
  return new Set((data ?? []).map(r => r.badge_id))
}

// Insère les nouveaux badges et retourne les objets badge débloqués
async function unlockBadges(ids) {
  if (!ids.length) return []
  await supabase.from('user_badges').insert(
    ids.map(badge_id => ({ user_id: user.value.id, badge_id }))
  )
  return ids.map(id => getBadge(id)).filter(Boolean)
}

// Vérifie les conditions après une session Score Training
export async function checkGameBadges({ correctCount, totalQuestions, bestStreak, cumulativeStats }) {
  if (!user.value) return []

  const unlocked   = await fetchUnlockedIds()
  const toUnlock   = []
  const { totalSessions } = cumulativeStats

  if (!unlocked.has('first_game'))
    toUnlock.push('first_game')

  if (!unlocked.has('assiduous') && totalSessions >= 10)
    toUnlock.push('assiduous')

  if (!unlocked.has('veteran') && totalSessions >= 50)
    toUnlock.push('veteran')

  if (!unlocked.has('on_fire') && bestStreak >= 10)
    toUnlock.push('on_fire')

  if (!unlocked.has('perfect') && totalQuestions >= 10 && correctCount === totalQuestions)
    toUnlock.push('perfect')

  return unlockBadges(toUnlock)
}

// Vérifie les conditions après une session Échauffement
export async function checkWarmupBadges({ totalDarts, accuracy, cumulativeStats }) {
  if (!user.value) return []

  const unlocked   = await fetchUnlockedIds()
  const toUnlock   = []
  const { totalSessions, totalDarts: cumDarts } = cumulativeStats

  if (!unlocked.has('first_warmup'))
    toUnlock.push('first_warmup')

  if (!unlocked.has('centurion') && cumDarts >= 100)
    toUnlock.push('centurion')

  if (!unlocked.has('thousand_darts') && cumDarts >= 1000)
    toUnlock.push('thousand_darts')

  if (!unlocked.has('assiduous') && totalSessions >= 10)
    toUnlock.push('assiduous')

  if (!unlocked.has('veteran') && totalSessions >= 50)
    toUnlock.push('veteran')

  if (!unlocked.has('precise') && accuracy >= 80)
    toUnlock.push('precise')

  if (!unlocked.has('sniper') && accuracy >= 95)
    toUnlock.push('sniper')

  return unlockBadges(toUnlock)
}

// Retourne la progression d'un badge non débloqué (ou null si binaire)
export function getBadgeProgress(badgeId, stats) {
  if (!stats) return null
  const { totalDarts, totalSessions, bestAccuracy, bestStreak } = stats
  switch (badgeId) {
    case 'centurion':      return { current: Math.min(totalDarts, 100),    target: 100,  suffix: '' }
    case 'thousand_darts': return { current: Math.min(totalDarts, 1000),   target: 1000, suffix: '' }
    case 'assiduous':      return { current: Math.min(totalSessions, 10),  target: 10,   suffix: '' }
    case 'veteran':        return { current: Math.min(totalSessions, 50),  target: 50,   suffix: '' }
    case 'on_fire':        return { current: Math.min(bestStreak, 10),     target: 10,   suffix: '' }
    case 'precise':        return { current: Math.round(bestAccuracy),     target: 80,   suffix: '%' }
    case 'sniper':         return { current: Math.round(bestAccuracy),     target: 95,   suffix: '%' }
    default:               return null
  }
}

// Récupère tous les badges de l'utilisateur avec leur date de déblocage
// ascending: false → les plus récents en premier
export async function fetchUserBadges() {
  if (!user.value) return []
  const { data } = await supabase
    .from('user_badges')
    .select('badge_id, unlocked_at')
    .eq('user_id', user.value.id)
    .order('unlocked_at', { ascending: false })
  return (data ?? []).map(r => ({
    ...getBadge(r.badge_id),
    unlockedAt: r.unlocked_at,
  })).filter(b => b.id)
}
