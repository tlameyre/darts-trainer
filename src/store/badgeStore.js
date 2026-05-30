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

// Récupère tous les badges de l'utilisateur avec leur date de déblocage
export async function fetchUserBadges() {
  if (!user.value) return []
  const { data } = await supabase
    .from('user_badges')
    .select('badge_id, unlocked_at')
    .eq('user_id', user.value.id)
    .order('unlocked_at', { ascending: true })
  return (data ?? []).map(r => ({
    ...getBadge(r.badge_id),
    unlockedAt: r.unlocked_at,
  })).filter(b => b.id)
}
