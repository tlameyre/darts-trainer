<script setup>
import { ref, onMounted } from 'vue'
import { fetchGlobalStats, fetchGameSessions, fetchWarmupSessions } from '../store/dbStore.js'

const stats          = ref(null)
const gameSessions   = ref([])
const warmupSessions = ref([])
const loading        = ref(true)

onMounted(async () => {
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
