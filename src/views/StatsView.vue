<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDbStore } from '../store/dbStore.js'
import StatsSessionModal from '../components/stats/StatsSessionModal.vue'

const dbStore = useDbStore()

// ── Données réelles ───────────────────────────────────────────────────────────
const globalStats = ref(null)
const gameSessions = ref([])
const warmupSessions = ref([])
const x01Sessions = ref([])
const loading = ref(true)

// ── Données fictives (dev uniquement) ────────────────────────────────────────
const MOCK_GLOBAL = {
  gameStats: {
    sessions: 24, totalCorrect: 312, totalQuestions: 360, bestStreak: 18,
  },
  warmupStats: {
    sessions: 31, totalDarts: 1247, totalHits: 893, avgAccuracy: 71,
  },
}
const MOCK_GAME = [
  { id: 1, correct_count: 17, total_questions: 20, best_streak: 9, played_at: '2025-05-28T18:32:00Z' },
  { id: 2, correct_count: 14, total_questions: 20, best_streak: 6, played_at: '2025-05-27T20:11:00Z' },
  { id: 3, correct_count: 18, total_questions: 20, best_streak: 18, played_at: '2025-05-26T19:45:00Z' },
  { id: 4, correct_count: 12, total_questions: 20, best_streak: 5, played_at: '2025-05-25T17:00:00Z' },
  { id: 5, correct_count: 15, total_questions: 20, best_streak: 8, played_at: '2025-05-24T21:30:00Z' },
]
const MOCK_WARMUP = [
  { id: 1, hits: 28, total_darts: 36, accuracy: 78, played_at: '2025-05-28T18:00:00Z' },
  { id: 2, hits: 22, total_darts: 33, accuracy: 67, played_at: '2025-05-27T19:50:00Z' },
  { id: 3, hits: 31, total_darts: 39, accuracy: 79, played_at: '2025-05-26T18:20:00Z' },
  { id: 4, hits: 19, total_darts: 30, accuracy: 63, played_at: '2025-05-25T16:40:00Z' },
  { id: 5, hits: 26, total_darts: 33, accuracy: 79, played_at: '2025-05-24T21:10:00Z' },
]
const MOCK_X01 = [
  { id: 1, start_score: 501, legs_played: 3, avg_volley: 58, avg_9darts: 71, avg_darts_to_finish: 22, min_darts: 19, max_darts: 26, highest_finish: 96, highest_volley: 140, played_at: '2025-05-28T19:00:00Z' },
  { id: 2, start_score: 501, legs_played: 2, avg_volley: 51, avg_9darts: 64, avg_darts_to_finish: 25, min_darts: 24, max_darts: 26, highest_finish: 40, highest_volley: 121, played_at: '2025-05-27T21:00:00Z' },
  { id: 3, start_score: 301, legs_played: 4, avg_volley: 47, avg_9darts: 60, avg_darts_to_finish: 18, min_darts: 15, max_darts: 22, highest_finish: 60, highest_volley: 100, played_at: '2025-05-26T20:00:00Z' },
  { id: 4, start_score: 501, legs_played: 3, avg_volley: 55, avg_9darts: 68, avg_darts_to_finish: 21, min_darts: 18, max_darts: 25, highest_finish: 110, highest_volley: 135, played_at: '2025-05-25T18:00:00Z' },
  { id: 5, start_score: 501, legs_played: 2, avg_volley: 62, avg_9darts: 74, avg_darts_to_finish: 20, min_darts: 19, max_darts: 21, highest_finish: 72, highest_volley: 180, played_at: '2025-05-24T22:00:00Z' },
]

onMounted(async () => {
  // if (import.meta.env.DEV) {
  //   globalStats.value    = MOCK_GLOBAL
  //   gameSessions.value   = MOCK_GAME
  //   warmupSessions.value = MOCK_WARMUP
  //   x01Sessions.value    = MOCK_X01
  //   loading.value        = false
  //   return
  // }
  const [s, gs, ws, x1] = await Promise.all([
    dbStore.fetchGlobalStats(),
    dbStore.fetchGameSessions(10),
    dbStore.fetchWarmupSessions(10),
    dbStore.fetchX01Sessions(10),
  ])
  globalStats.value = s
  gameSessions.value = gs
  warmupSessions.value = ws
  x01Sessions.value = x1
  loading.value = false
})

// ── Sélecteur de mode ─────────────────────────────────────────────────────────
const MODES = [
  { id: 'score', label: 'Score', color: '#D64A24' },
  { id: 'warmup', label: 'Warmup', color: '#1D4ED8' },
  { id: 'x01', label: '501', color: '#047857' },
]
const selectedMode = ref('score')
const activeMode = computed(() => MODES.find(m => m.id === selectedMode.value))

// ── Données agrégées X01 ──────────────────────────────────────────────────────
const x01Stats = computed(() => {
  const sessions = x01Sessions.value
  if (!sessions.length) return null
  return {
    sessions: sessions.length,
    avgVolley: Math.round(sessions.reduce((s, r) => s + Number(r.avg_volley), 0) / sessions.length),
    avg9darts: Math.round(sessions.reduce((s, r) => s + Number(r.avg_9darts), 0) / sessions.length),
    avgDartsToFinish: Math.round(sessions.reduce((s, r) => s + Number(r.avg_darts_to_finish), 0) / sessions.length),
    highestFinish: Math.max(...sessions.map(r => r.highest_finish ?? 0)),
    highestVolley: Math.max(...sessions.map(r => r.highest_volley ?? 0)),
  }
})

// ── Modale de détail ──────────────────────────────────────────────────────────
const selectedSession = ref(null)
const showDetail = ref(false)

function openDetail(session) {
  selectedSession.value = session
  showDetail.value = true
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function accuracy(correct, total) {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}
</script>

<template>
  <div class="stats">
    <header class="stats__header">
      <h1 class="stats__title">STATISTIQUES</h1>

      <!-- Sélecteur de mode -->
      <div class="stats__tabs">
        <button v-for="mode in MODES" :key="mode.id" class="stats__tab"
          :class="{ 'stats__tab--active': selectedMode === mode.id }"
          :style="selectedMode === mode.id ? { '--tab-color': mode.color } : {}" @click="selectedMode = mode.id">
          {{ mode.label }}
        </button>
      </div>
    </header>

    <main class="stats__main">
      <div v-if="loading" class="stats__loading">Chargement…</div>

      <template v-else>

        <!-- ── Score Training ───────────────────────────────────────────── -->
        <template v-if="selectedMode === 'score'">
          <section v-if="globalStats?.gameStats" class="stats__card">
            <h2 class="stats__section-title">Résumé</h2>
            <div class="stats__grid">
              <div class="stats__stat">
                <span class="stats__stat-value">{{ globalStats.gameStats.sessions }}</span>
                <span class="stats__stat-label">Sessions</span>
              </div>
              <div class="stats__stat">
                <span class="stats__stat-value">
                  {{ accuracy(globalStats.gameStats.totalCorrect, globalStats.gameStats.totalQuestions) }}%
                </span>
                <span class="stats__stat-label">Précision</span>
              </div>
              <div class="stats__stat">
                <span class="stats__stat-value">{{ globalStats.gameStats.bestStreak }}</span>
                <span class="stats__stat-label">Meilleure série</span>
              </div>
            </div>
          </section>

          <section v-if="gameSessions.length" class="stats__card">
            <h2 class="stats__section-title">Historique</h2>
            <ul class="stats__history">
              <li v-for="s in gameSessions" :key="s.id" class="stats__history-item stats__history-item--btn"
                @click="openDetail(s)">
                <div class="stats__history-left">
                  <span class="stats__history-score">{{ s.correct_count }}/{{ s.total_questions }}</span>
                  <span class="stats__history-badge">série {{ s.best_streak }}</span>
                </div>
                <span class="stats__history-date">{{ formatDate(s.played_at) }}</span>
              </li>
            </ul>
          </section>

          <div v-if="!globalStats?.gameStats && !gameSessions.length" class="stats__empty">
            Lance une partie Score Training pour voir tes stats ici.
          </div>
        </template>

        <!-- ── Échauffement ─────────────────────────────────────────────── -->
        <template v-else-if="selectedMode === 'warmup'">
          <section v-if="globalStats?.warmupStats" class="stats__card">
            <h2 class="stats__section-title">Résumé</h2>
            <div class="stats__grid">
              <div class="stats__stat">
                <span class="stats__stat-value">{{ globalStats.warmupStats.sessions }}</span>
                <span class="stats__stat-label">Sessions</span>
              </div>
              <div class="stats__stat">
                <span class="stats__stat-value">{{ globalStats.warmupStats.totalDarts }}</span>
                <span class="stats__stat-label">Fléchettes</span>
              </div>
              <div class="stats__stat">
                <span class="stats__stat-value">{{ globalStats.warmupStats.avgAccuracy }}%</span>
                <span class="stats__stat-label">Précision moy.</span>
              </div>
            </div>
          </section>

          <section v-if="warmupSessions.length" class="stats__card">
            <h2 class="stats__section-title">Historique</h2>
            <ul class="stats__history">
              <li v-for="s in warmupSessions" :key="s.id" class="stats__history-item stats__history-item--btn"
                @click="openDetail(s)">
                <div class="stats__history-left">
                  <span class="stats__history-score">{{ s.hits }}/{{ s.total_darts }}</span>
                  <span class="stats__history-badge">{{ s.accuracy }}%</span>
                </div>
                <span class="stats__history-date">{{ formatDate(s.played_at) }}</span>
              </li>
            </ul>
          </section>

          <div v-if="!globalStats?.warmupStats && !warmupSessions.length" class="stats__empty">
            Lance une session d'échauffement pour voir tes stats ici.
          </div>
        </template>

        <!-- ── 501 ──────────────────────────────────────────────────────── -->
        <template v-else-if="selectedMode === 'x01'">
          <section v-if="x01Stats" class="stats__card">
            <h2 class="stats__section-title">Résumé</h2>
            <div class="stats__grid stats__grid--2">
              <div class="stats__stat">
                <span class="stats__stat-value">{{ x01Stats.sessions }}</span>
                <span class="stats__stat-label">Sessions</span>
              </div>
              <div class="stats__stat">
                <span class="stats__stat-value">{{ x01Stats.highestVolley }}</span>
                <span class="stats__stat-label">Meilleure volée</span>
              </div>
            </div>
            <div class="stats__grid stats__grid--3">
              <div class="stats__stat">
                <span class="stats__stat-value">{{ x01Stats.avgVolley }}</span>
                <span class="stats__stat-label">Moy. volée</span>
              </div>
              <div class="stats__stat">
                <span class="stats__stat-value">{{ x01Stats.avg9darts }}</span>
                <span class="stats__stat-label">Moy. 9 darts</span>
              </div>
              <div class="stats__stat">
                <span class="stats__stat-value">{{ x01Stats.avgDartsToFinish }}</span>
                <span class="stats__stat-label">Moy. fléch. / manche</span>
              </div>
            </div>
            <div class="stats__stat-highlight">
              <span class="stats__stat-highlight-label">Plus haut finish</span>
              <span class="stats__stat-highlight-value">{{ x01Stats.highestFinish }}</span>
            </div>
          </section>

          <section v-if="x01Sessions.length" class="stats__card">
            <h2 class="stats__section-title">Historique</h2>
            <ul class="stats__history">
              <li v-for="s in x01Sessions" :key="s.id" class="stats__history-item stats__history-item--btn"
                @click="openDetail(s)">
                <div class="stats__history-left">
                  <span class="stats__history-score">{{ s.start_score }}</span>
                  <span class="stats__history-badge">{{ s.legs_played }} manche{{ s.legs_played > 1 ? 's' : '' }}</span>
                  <span class="stats__history-badge">moy. {{ Math.round(s.avg_volley) }}</span>
                </div>
                <span class="stats__history-date">{{ formatDate(s.played_at) }}</span>
              </li>
            </ul>
          </section>

          <div v-if="!x01Stats && !x01Sessions.length" class="stats__empty">
            Lance une partie 501 pour voir tes stats ici.
          </div>
        </template>

      </template>
    </main>

    <StatsSessionModal :show="showDetail" :session="selectedSession" :mode="selectedMode" @close="showDetail = false" />
  </div>
</template>

<style lang="scss" scoped>
.stats {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $gap-lg;

  // ── Header ──────────────────────────────────────────────────────────────
  &__header {
    padding-top: $padding-lg;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__title {
    @include title-xl;
  }

  // ── Tabs ────────────────────────────────────────────────────────────────
  &__tabs {
    display: flex;
    gap: $gap-xs;
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    padding: 4px;
  }

  &__tab {
    flex: 1;
    padding: $padding-xs $padding-sm;
    border-radius: calc($radius-md - 4px);
    @include title-sm;
    font-weight: 700;
    text-transform: uppercase;
    color: $muted;
    transition: background 0.2s, color 0.2s;
    letter-spacing: 0.03em;

    &--active {
      background: var(--tab-color, $orange);
      color: $white;
    }
  }

  // ── Loading / empty ──────────────────────────────────────────────────────
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

  // ── Card ────────────────────────────────────────────────────────────────
  &__card {
    background: rgba($white, 0.05);
    border-radius: $radius-lg;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  // ── Grilles de stats ────────────────────────────────────────────────────
  &__grid {
    display: grid;
    gap: $gap-sm;

    &--2 {
      grid-template-columns: repeat(2, 1fr);
    }

    &--3 {
      grid-template-columns: repeat(3, 1fr);
    }

    // défaut : 3 colonnes
    &:not([class*='--']) {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    background: rgba($white, 0.04);
    border-radius: $radius-md;
    padding: $padding-sm $padding-xs;
  }

  &__stat-value {
    @include title-xl;
    color: $text-color;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  &__stat-label {
    @include title-xs;
    color: $muted;
    text-align: center;
    line-height: 1.3;
  }

  // Stat en ligne (highlight finish)
  &__stat-highlight {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(#047857, 0.15);
    border: 1px solid rgba(#047857, 0.3);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
  }

  &__stat-highlight-label {
    @include title-sm;
    color: $muted;
  }

  &__stat-highlight-value {
    @include title-xl;
    color: $white;
    font-variant-numeric: tabular-nums;
  }

  // ── Historique ──────────────────────────────────────────────────────────
  &__history {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  &__history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $padding-xs 0;
    border-bottom: 1px solid rgba($white, 0.06);

    &:last-child {
      border-bottom: none;
    }

    &--btn {
      cursor: pointer;
      transition: opacity 0.15s;

      &:active {
        opacity: 0.6;
      }
    }
  }

  &__history-left {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__history-score {
    @include text-sm;
    color: $text-color;
    font-variant-numeric: tabular-nums;
  }

  &__history-badge {
    @include title-xs;
    color: $muted;
    background: rgba($white, 0.07);
    border-radius: $radius-pill;
    padding: 2px 8px;
  }

  &__history-date {
    @include title-xs;
    color: $muted;
    flex-shrink: 0;
  }
}

@media (min-width: $bp-laptop) {
  .stats {
    padding: $padding-xl $padding-xl calc($padding-xxl + 64px);
    gap: $gap-xl;

    &__header { gap: $gap-lg; padding-top: $padding-xl; }
    &__title  { @include title-xxl; }

    &__tab { @include title-md; padding: $padding-sm $padding-md; }

    &__main { gap: $gap-lg; }

    &__card {
      padding: $padding-xl;
      gap: $gap-lg;
    }

    &__section-title { @include title-md; }

    &__stat        { padding: $padding-md $padding-sm; }
    &__stat-value  { @include title-xxl; }
    &__stat-label  { @include title-sm; }

    &__stat-highlight        { padding: $padding-md $padding-lg; }
    &__stat-highlight-label  { @include title-md; }
    &__stat-highlight-value  { @include title-xxl; }

    &__history-item   { padding: $padding-sm 0; }
    &__history-score  { @include text-md; }
    &__history-badge  { @include title-sm; }
    &__history-date   { @include title-sm; }

    &__loading,
    &__empty { @include text-md; }
  }
}
</style>
