<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDbStore } from '../store/dbStore.js'
import AppTabs from '../components/AppTabs.vue'
import StatCell from '../components/StatCell.vue'
import StatsSessionDetail from '../components/stats/StatsSessionDetail.vue'

const dbStore = useDbStore()

const globalStats    = ref(null)
const gameSessions   = ref([])
const warmupSessions = ref([])
const x01Sessions    = ref([])
const loading        = ref(true)

onMounted(async () => {
  const [s, gs, ws, x1] = await Promise.all([
    dbStore.fetchGlobalStats(),
    dbStore.fetchGameSessions(10),
    dbStore.fetchWarmupSessions(10),
    dbStore.fetchX01Sessions(10),
  ])
  globalStats.value    = s
  gameSessions.value   = gs
  warmupSessions.value = ws
  x01Sessions.value    = x1
  loading.value        = false
})

const MODES = [
  { id: 'score',  label: 'Score',  color: '#D64A24' },
  { id: 'warmup', label: 'Warmup', color: '#1D4ED8' },
  { id: 'x01',    label: '501',    color: '#047857' },
]
const selectedMode = ref('score')

const x01Stats = computed(() => {
  const sessions = x01Sessions.value
  if (!sessions.length) return null
  return {
    sessions:         sessions.length,
    avgVolley:        Math.round(sessions.reduce((s, r) => s + Number(r.avg_volley), 0) / sessions.length),
    avg9darts:        Math.round(sessions.reduce((s, r) => s + Number(r.avg_9darts), 0) / sessions.length),
    avgDartsToFinish: Math.round(sessions.reduce((s, r) => s + Number(r.avg_darts_to_finish), 0) / sessions.length),
    highestFinish:    Math.max(...sessions.map(r => r.highest_finish ?? 0)),
    highestVolley:    Math.max(...sessions.map(r => r.highest_volley ?? 0)),
  }
})

const selectedSession = ref(null)
const showDetail      = ref(false)

function openDetail(session) {
  selectedSession.value = session
  showDetail.value      = true
}

async function deleteSession(id) {
  if (selectedMode.value === 'score') {
    await dbStore.deleteGameSession(id)
    gameSessions.value = gameSessions.value.filter(s => s.id !== id)
  } else if (selectedMode.value === 'warmup') {
    await dbStore.deleteWarmupSession(id)
    warmupSessions.value = warmupSessions.value.filter(s => s.id !== id)
  } else if (selectedMode.value === 'x01') {
    await dbStore.deleteX01Session(id)
    x01Sessions.value = x01Sessions.value.filter(s => s.id !== id)
  }
  showDetail.value = false
}

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
      <AppTabs :tabs="MODES" v-model="selectedMode" />
    </header>

    <main class="stats__main">
      <div v-if="loading" class="stats__empty">Chargement…</div>

      <template v-else>

        <!-- ── Score Training ───────────────────────────────────────────── -->
        <template v-if="selectedMode === 'score'">
          <section v-if="globalStats?.gameStats" class="stats__card">
            <h2 class="stats__section-title">Résumé</h2>
            <div class="stats__grid">
              <StatCell :value="globalStats.gameStats.sessions" label="Sessions" />
              <StatCell :value="accuracy(globalStats.gameStats.totalCorrect, globalStats.gameStats.totalQuestions) + '%'" label="Précision" />
              <StatCell :value="globalStats.gameStats.bestStreak" label="Meilleure série" />
            </div>
          </section>

          <section v-if="gameSessions.length" class="stats__card">
            <h2 class="stats__section-title">Historique</h2>
            <ul class="stats__history">
              <li v-for="s in gameSessions" :key="s.id" class="stats__history-item stats__history-item--btn" @click="openDetail(s)">
                <div class="stats__history-left">
                  <span class="stats__history-score">{{ s.correct_count }}/{{ s.total_questions }}</span>
                  <span class="stats__history-badge">série {{ s.best_streak }}</span>
                </div>
                <span class="stats__history-date">{{ formatDate(s.played_at) }}</span>
              </li>
            </ul>
          </section>

          <p v-if="!globalStats?.gameStats && !gameSessions.length" class="stats__empty">
            Lance une partie Score Training pour voir tes stats ici.
          </p>
        </template>

        <!-- ── Échauffement ─────────────────────────────────────────────── -->
        <template v-else-if="selectedMode === 'warmup'">
          <section v-if="globalStats?.warmupStats" class="stats__card">
            <h2 class="stats__section-title">Résumé</h2>
            <div class="stats__grid">
              <StatCell :value="globalStats.warmupStats.sessions" label="Sessions" />
              <StatCell :value="globalStats.warmupStats.totalDarts" label="Fléchettes" />
              <StatCell :value="globalStats.warmupStats.avgAccuracy + '%'" label="Précision moy." />
            </div>
          </section>

          <section v-if="warmupSessions.length" class="stats__card">
            <h2 class="stats__section-title">Historique</h2>
            <ul class="stats__history">
              <li v-for="s in warmupSessions" :key="s.id" class="stats__history-item stats__history-item--btn" @click="openDetail(s)">
                <div class="stats__history-left">
                  <span class="stats__history-score">{{ s.hits }}/{{ s.total_darts }}</span>
                  <span class="stats__history-badge">{{ s.accuracy }}%</span>
                </div>
                <span class="stats__history-date">{{ formatDate(s.played_at) }}</span>
              </li>
            </ul>
          </section>

          <p v-if="!globalStats?.warmupStats && !warmupSessions.length" class="stats__empty">
            Lance une session d'échauffement pour voir tes stats ici.
          </p>
        </template>

        <!-- ── 501 ──────────────────────────────────────────────────────── -->
        <template v-else-if="selectedMode === 'x01'">
          <section v-if="x01Stats" class="stats__card">
            <h2 class="stats__section-title">Résumé</h2>
            <div class="stats__grid stats__grid--2">
              <StatCell :value="x01Stats.sessions" label="Sessions" />
              <StatCell :value="x01Stats.highestVolley" label="Meilleure volée" />
            </div>
            <div class="stats__grid stats__grid--3">
              <StatCell :value="x01Stats.avgVolley" label="Moy. volée" />
              <StatCell :value="x01Stats.avg9darts" label="Moy. 9 darts" />
              <StatCell :value="x01Stats.avgDartsToFinish" label="Moy. fléch. / manche" />
            </div>
            <div class="stats__stat-highlight">
              <span class="stats__stat-highlight-label">Plus haut finish</span>
              <span class="stats__stat-highlight-value">{{ x01Stats.highestFinish }}</span>
            </div>
          </section>

          <section v-if="x01Sessions.length" class="stats__card">
            <h2 class="stats__section-title">Historique</h2>
            <ul class="stats__history">
              <li v-for="s in x01Sessions" :key="s.id" class="stats__history-item stats__history-item--btn" @click="openDetail(s)">
                <div class="stats__history-left">
                  <span class="stats__history-score">{{ s.start_score }}</span>
                  <span class="stats__history-badge">{{ s.legs_played }} manche{{ s.legs_played > 1 ? 's' : '' }}</span>
                  <span class="stats__history-badge">moy. {{ Math.round(s.avg_volley) }}</span>
                </div>
                <span class="stats__history-date">{{ formatDate(s.played_at) }}</span>
              </li>
            </ul>
          </section>

          <p v-if="!x01Stats && !x01Sessions.length" class="stats__empty">
            Lance une partie 501 pour voir tes stats ici.
          </p>
        </template>

      </template>
    </main>

    <StatsSessionDetail
      :show="showDetail"
      :session="selectedSession"
      :mode="selectedMode"
      @close="showDetail = false"
      @delete="deleteSession"
    />
  </div>
</template>

<style lang="scss" scoped>
.stats {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $gap-lg;

  &__header {
    padding-top: $padding-lg;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__title {
    @include title-xl;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }

  // ── Card ──────────────────────────────────────────────────────────────────
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

  // ── Grilles ────────────────────────────────────────────────────────────────
  &__grid {
    display: grid;
    gap: $gap-sm;
    grid-template-columns: repeat(3, 1fr);

    &--2 { grid-template-columns: repeat(2, 1fr); }
    &--3 { grid-template-columns: repeat(3, 1fr); }
  }

  // ── Highlight stat (ligne) ─────────────────────────────────────────────────
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

  // ── Historique ────────────────────────────────────────────────────────────
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

    &:last-child  { border-bottom: none; }
    &--btn        { cursor: pointer; transition: opacity 0.15s; &:active { opacity: 0.6; } }
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

    &__header      { gap: $gap-lg; padding-top: $padding-xl; }
    &__title       { @include title-xxl; }
    &__main        { gap: $gap-lg; }
    &__empty       { @include text-md; }

    &__card        { padding: $padding-xl; gap: $gap-lg; }
    &__section-title { @include title-md; }

    &__stat-highlight       { padding: $padding-md $padding-lg; }
    &__stat-highlight-label { @include title-md; }
    &__stat-highlight-value { @include title-xxl; }

    &__history-item  { padding: $padding-sm 0; }
    &__history-score { @include text-md; }
    &__history-badge { @include title-sm; }
    &__history-date  { @include title-sm; }
  }
}
</style>
