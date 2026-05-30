import { supabase } from '../lib/supabase.js'
import { user } from './authStore.js'

export async function saveGameSession({ correctCount, totalQuestions, streak, bestStreak, settings }) {
  if (!user.value) return
  const { error } = await supabase.from('game_sessions').insert({
    user_id:         user.value.id,
    correct_count:   correctCount,
    total_questions: totalQuestions,
    streak,
    best_streak:     bestStreak,
    settings,
  })
  if (error) console.error('[dbStore] saveGameSession:', error.message)
}

export async function saveWarmupSession({ zone, totalDarts, hits, durationS, settings }) {
  if (!user.value) return
  const accuracy = totalDarts > 0 ? Math.round((hits / totalDarts) * 100) : 0
  const { error } = await supabase.from('warmup_sessions').insert({
    user_id:     user.value.id,
    zone,
    total_darts: totalDarts,
    hits,
    accuracy,
    duration_s:  durationS,
    settings,
  })
  if (error) console.error('[dbStore] saveWarmupSession:', error.message)
}

export async function fetchGameSessions(limit = 20) {
  if (!user.value) return []
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', user.value.id)
    .order('played_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data
}

export async function fetchWarmupSessions(limit = 20) {
  if (!user.value) return []
  const { data, error } = await supabase
    .from('warmup_sessions')
    .select('*')
    .eq('user_id', user.value.id)
    .order('played_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data
}

export async function fetchGlobalStats() {
  if (!user.value) return null

  const [{ data: gameSessions }, { data: warmupSessions }] = await Promise.all([
    supabase.from('game_sessions').select('correct_count, total_questions, best_streak').eq('user_id', user.value.id),
    supabase.from('warmup_sessions').select('total_darts, hits, accuracy').eq('user_id', user.value.id),
  ])

  const gameStats = gameSessions?.length
    ? {
        sessions:    gameSessions.length,
        totalCorrect: gameSessions.reduce((s, r) => s + r.correct_count, 0),
        totalQuestions: gameSessions.reduce((s, r) => s + r.total_questions, 0),
        bestStreak:  Math.max(...gameSessions.map(r => r.best_streak ?? 0)),
      }
    : null

  const warmupStats = warmupSessions?.length
    ? {
        sessions:   warmupSessions.length,
        totalDarts: warmupSessions.reduce((s, r) => s + r.total_darts, 0),
        totalHits:  warmupSessions.reduce((s, r) => s + r.hits, 0),
        avgAccuracy: Math.round(
          warmupSessions.reduce((s, r) => s + Number(r.accuracy), 0) / warmupSessions.length
        ),
      }
    : null

  return { gameStats, warmupStats }
}
