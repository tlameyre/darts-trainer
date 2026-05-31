<script setup>
import { ref, onMounted } from 'vue'
import { fetchGlobalStats, fetchGameSessions, fetchWarmupSessions } from '../store/dbStore.js'

const stats          = ref(null)
const gameSessions   = ref([])
const warmupSessions = ref([])
const loading        = ref(true)

// ── Données fictives pour le stylisme (dev uniquement) ───────────────────────
const MOCK_STATS = {
  gameStats: {
    sessions:       24,
    totalCorrect:   312,
    totalQuestions: 360,
    bestStreak:     18,
  },
  warmupStats: {
    sessions:   31,
    totalDarts: 1247,
    totalHits:  893,
    avgAccuracy: 71,
  },
}

const MOCK_GAME_SESSIONS = [
  { id: 1, correct_count: 17, total_questions: 20, best_streak: 9,  played_at: '2025-05-28T18:32:00Z' },
  { id: 2, correct_count: 14, total_questions: 20, best_streak: 6,  played_at: '2025-05-27T20:11:00Z' },
  { id: 3, correct_count: 18, total_questions: 20, best_streak: 18, played_at: '2025-05-26T19:45:00Z' },
  { id: 4, correct_count: 12, total_questions: 20, best_streak: 5,  played_at: '2025-05-25T17:00:00Z' },
  { id: 5, correct_count: 15, total_questions: 20, best_streak: 8,  played_at: '2025-05-24T21:30:00Z' },
]

const MOCK_WARMUP_SESSIONS = [
  { id: 1, hits: 28, total_darts: 36, accuracy: 78, played_at: '2025-05-28T18:00:00Z' },
  { id: 2, hits: 22, total_darts: 33, accuracy: 67, played_at: '2025-05-27T19:50:00Z' },
  { id: 3, hits: 31, total_darts: 39, accuracy: 79, played_at: '2025-05-26T18:20:00Z' },
  { id: 4, hits: 19, total_darts: 30, accuracy: 63, played_at: '2025-05-25T16:40:00Z' },
  { id: 5, hits: 26, total_darts: 33, accuracy: 79, played_at: '2025-05-24T21:10:00Z' },
]

onMounted(async () => {
  if (import.meta.env.DEV) {
    stats.value          = MOCK_STATS
    gameSessions.value   = MOCK_GAME_SESSIONS
    warmupSessions.value = MOCK_WARMUP_SESSIONS
    loading.value        = false
    return
  }

  const [s, gs, ws] = await Promise.all([
    fetchGlobalStats(),
    fetchGameSessions(10),
    fetchWarmupSessions(10),
  ])
  stats.value          = s
  gameSessions.value   = gs
  warmupSessions.value = ws
  loading.value        = false
})

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
</script>

<template>
  <div class="stats">
    <header class="stats__header">
      <h1 class="stats__title">STATISTIQUES</h1>
    </header>

    <main class="stats__main">
      <div v-if="loading" class="stats__loading">Chargement…</div>

      <template v-else>

        <!-- Score Training -->
        <section v-if="stats?.gameStats" class="stats__card">
          <h2 class="stats__section-title">Score Training</h2>
          <div class="stats__grid">
            <div class="stats__stat">
              <span class="stats__stat-value">{{ stats.gameStats.sessions }}</span>
              <span class="stats__stat-label">Sessions</span>
            </div>
            <div class="stats__stat">
              <span class="stats__stat-value">
                {{ stats.gameStats.totalQuestions > 0
                  ? Math.round((stats.gameStats.totalCorrect / stats.gameStats.totalQuestions) * 100)
                  : 0 }}%
              </span>
              <span class="stats__stat-label">Précision</span>
            </div>
            <div class="stats__stat">
              <span class="stats__stat-value">{{ stats.gameStats.bestStreak }}</span>
              <span class="stats__stat-label">Meilleure série</span>
            </div>
          </div>
        </section>

        <section v-if="gameSessions.length" class="stats__card">
          <h2 class="stats__section-title">Historique — Score Training</h2>
          <ul class="stats__history">
            <li v-for="s in gameSessions" :key="s.id" class="stats__history-item">
              <div class="stats__history-left">
                <span class="stats__history-score">{{ s.correct_count }}/{{ s.total_questions }}</span>
                <span class="stats__history-meta">série {{ s.best_streak }}</span>
              </div>
              <span class="stats__history-date">{{ formatDate(s.played_at) }}</span>
            </li>
          </ul>
        </section>

        <!-- Échauffement -->
        <section v-if="stats?.warmupStats" class="stats__card">
          <h2 class="stats__section-title">Échauffement</h2>
          <div class="stats__grid">
            <div class="stats__stat">
              <span class="stats__stat-value">{{ stats.warmupStats.sessions }}</span>
              <span class="stats__stat-label">Sessions</span>
            </div>
            <div class="stats__stat">
              <span class="stats__stat-value">{{ stats.warmupStats.totalDarts }}</span>
              <span class="stats__stat-label">Fléchettes</span>
            </div>
            <div class="stats__stat">
              <span class="stats__stat-value">{{ stats.warmupStats.avgAccuracy }}%</span>
              <span class="stats__stat-label">Précision moy.</span>
            </div>
          </div>
        </section>

        <section v-if="warmupSessions.length" class="stats__card">
          <h2 class="stats__section-title">Historique — Échauffement</h2>
          <ul class="stats__history">
            <li v-for="s in warmupSessions" :key="s.id" class="stats__history-item">
              <div class="stats__history-left">
                <span class="stats__history-score">{{ s.hits }}/{{ s.total_darts }}</span>
                <span class="stats__history-meta">{{ s.accuracy }}%</span>
              </div>
              <span class="stats__history-date">{{ formatDate(s.played_at) }}</span>
            </li>
          </ul>
        </section>

        <div v-if="!stats?.gameStats && !stats?.warmupStats" class="stats__empty">
          Joue ta première partie pour voir tes stats ici.
        </div>

      </template>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.stats {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__header {
    padding-top: $padding-lg;
  }

  &__title {
    @include title-xl;
    font-size: 24px;
  }

  &__loading,
  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-lg;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $gap-sm;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__stat-value {
    @include title-xl;
    color: $text-color;
  }

  &__stat-label {
    @include text-sm;
    color: $muted;
    text-align: center;
    font-size: 11px;
  }

  &__history {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $padding-xs 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    &:last-child { border-bottom: none; }
  }

  &__history-left {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__history-score {
    @include text-sm;
    color: $text-color;
  }

  &__history-meta,
  &__history-date {
    @include text-sm;
    color: $muted;
    font-size: 13px;
  }
}
</style>
