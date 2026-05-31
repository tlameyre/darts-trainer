import { supabase } from '../lib/supabase.js'
import { user } from './authStore.js'

export async function saveGameSession({ correctCount, totalQuestions, bestStreak, settings }) {
  if (!user.value) return
  const { error } = await supabase.from('game_sessions').insert({
    user_id:         user.value.id,
    correct_count:   correctCount,
    total_questions: totalQuestions,
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

/**
 * SQL à exécuter dans Supabase pour créer la table x01_sessions :
 *
 * CREATE TABLE public.x01_sessions (
 *   id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id             uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
 *   played_at           timestamptz DEFAULT now(),
 *   start_score         int NOT NULL,
 *   legs_played         int NOT NULL,
 *   avg_volley          numeric,
 *   avg_9darts          numeric,
 *   avg_darts_to_finish numeric,
 *   min_darts           int,
 *   max_darts           int,
 *   highest_finish      int,
 *   highest_volley      int,
 *   settings            jsonb
 * );
 * ALTER TABLE public.x01_sessions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users manage own x01_sessions"
 *   ON public.x01_sessions FOR ALL USING (auth.uid() = user_id);
 */
export async function saveX01Session({ startScore, legsPlayed, stats, settings }) {
  if (!user.value) return
  const { error } = await supabase.from('x01_sessions').insert({
    user_id:             user.value.id,
    start_score:         startScore,
    legs_played:         legsPlayed,
    avg_volley:          stats.avgVolley,
    avg_9darts:          stats.avg9darts,
    avg_darts_to_finish: stats.avgDartsToFinish,
    min_darts:           stats.minDarts,
    max_darts:           stats.maxDarts,
    highest_finish:      stats.highestFinish,
    highest_volley:      stats.highestVolley,
    settings,
  })
  if (error) console.error('[dbStore] saveX01Session:', error.message)
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

export async function fetchProfileStats() {
  if (!user.value) return null

  const [{ data: gameSessions }, { data: warmupSessions }] = await Promise.all([
    supabase.from('game_sessions').select('id, best_streak, correct_count').eq('user_id', user.value.id),
    supabase.from('warmup_sessions').select('total_darts, accuracy').eq('user_id', user.value.id),
  ])

  const totalSessions = (gameSessions?.length ?? 0) + (warmupSessions?.length ?? 0)
  const totalDarts    = warmupSessions?.reduce((s, r) => s + r.total_darts, 0) ?? 0
  const avgAccuracy   = warmupSessions?.length
    ? Math.round(warmupSessions.reduce((s, r) => s + Number(r.accuracy), 0) / warmupSessions.length)
    : null
  const bestAccuracy  = warmupSessions?.length
    ? Math.max(...warmupSessions.map(r => Number(r.accuracy)))
    : 0
  const bestStreak    = gameSessions?.length
    ? Math.max(...gameSessions.map(r => r.best_streak ?? 0))
    : 0
  const totalCorrect  = gameSessions?.reduce((s, r) => s + (r.correct_count ?? 0), 0) ?? 0

  // Moyenne de précision sur les 10 dernières sessions warmup
  const last10        = warmupSessions?.slice(-10) ?? []
  const avg80eligible = last10.length >= 10
  const avgAccuracy10 = avg80eligible
    ? Math.round(last10.reduce((s, r) => s + Number(r.accuracy), 0) / 10)
    : 0

  return { totalSessions, totalDarts, avgAccuracy, bestAccuracy, bestStreak, totalCorrect, avgAccuracy10, avg80eligible }
}

export async function fetchX01Sessions(limit = 20) {
  if (!user.value) return []
  const { data, error } = await supabase
    .from('x01_sessions')
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
