<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GAME_MODES } from '../data/gameModes.js'
import { useDbStore } from '../store/dbStore.js'
import { useGameStore } from '../store/gameStore.js'
import { useOnlineMatchStore } from '../store/onlineMatchStore.js'
import { useProfileDisplay } from '../composables/useProfileDisplay.js'
import PageHeader from '../components/PageHeader.vue'
import SectionTitle from '../components/SectionTitle.vue'
import LastSessionHero from '../components/play/LastSessionHero.vue'
import PlayModeCard from '../components/play/PlayModeCard.vue'

// Optional mock data — only used by /dev to preview without auth
// { score, warmup, checkout, x01: [], tactics, tournament, invites }
const props = defineProps({
  mockData: { type: Object, default: null },
})

const router            = useRouter()
const dbStore           = useDbStore()
const gameStore         = useGameStore()
const onlineMatchStore  = useOnlineMatchStore()
const { displayName, initials } = useProfileDisplay()

const last = ref({
  score: null, warmup: null, checkout: null, x01: [], tactics: null, tournament: null,
  ...props.mockData,
})

onMounted(() => {
  if (props.mockData) return
  // Independent loads: a slow request must not hold back the other cards
  dbStore.fetchGameSessions(1).then(r => { last.value.score = r[0] ?? null })
  dbStore.fetchWarmupSessions(1).then(r => { last.value.warmup = r[0] ?? null })
  dbStore.fetchCheckoutSessions(1).then(r => { last.value.checkout = r[0] ?? null })
  dbStore.fetchX01Sessions(10).then(r => { last.value.x01 = r })
  dbStore.fetchTacticsSessions(1).then(r => { last.value.tactics = r[0] ?? null })
  dbStore.fetchActiveTournaments(1).then(r => { last.value.tournament = r[0] ?? null })
})

const WIKI_TILE = { label: 'Encyclopédie', icon: 'book', color: '#14110F' }

const byId       = id => GAME_MODES.find(m => m.id === id)
const trainModes = GAME_MODES.filter(m => m.group === 'train')
const playModes  = GAME_MODES.filter(m => m.group !== 'train')

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)
const fmt1 = v => Number(v).toFixed(1).replace('.', ',')

// ── Last session (any of the four recorded modes) ───────────────────────────
function relativeDay(iso) {
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Settings kept in the session row that are not part of what the game was started with
function startSettings(settings) {
  const { history: _history, durationMs: _durationMs, ...rest } = settings ?? {}
  return rest
}

const lastSession = computed(() => {
  const { score, warmup, checkout, x01 } = last.value
  const candidates = [
    score    && { mode: byId('score-training'), row: score },
    warmup   && { mode: byId('warmup'), row: warmup },
    checkout && { mode: byId('checkout'), row: checkout },
    x01[0]   && { mode: byId('x01'), row: x01[0] },
  ].filter(Boolean)
  if (!candidates.length) return null

  const { mode, row } = candidates.reduce((a, b) => (new Date(b.row.played_at) > new Date(a.row.played_at) ? b : a))
  const caption = `Dernière session · ${relativeDay(row.played_at)}`
  const base = { color: mode.color, caption, duration: null, action: 'Relancer les mêmes réglages' }

  if (mode.id === 'score-training') {
    const durationMs = row.settings?.durationMs
    return {
      ...base,
      title: mode.label,
      duration: durationMs ? `${Math.max(1, Math.round(durationMs / 60000))} min` : null,
      tags: [`${row.total_questions} questions`],
      metrics: [
        { value: `${pct(row.correct_count, row.total_questions)} %`, label: 'juste' },
        { value: row.best_streak ?? 0, label: 'meilleure série' },
      ],
      relaunch: () => {
        gameStore.gameSettings = startSettings(row.settings)
        router.push({ name: 'score-game' })
      },
    }
  }
  if (mode.id === 'warmup') {
    const zones = row.settings?.zoneRecap?.[0]?.zones
    return {
      ...base,
      title: mode.label,
      duration: row.duration_s ? `${Math.max(1, Math.round(row.duration_s / 60))} min` : null,
      tags: String(row.zone).split('+'),
      metrics: [
        { value: `${row.accuracy} %`, label: 'précision' },
        { value: row.total_darts, label: 'fléchettes' },
      ],
      relaunch: () => {
        if (!zones?.length || !row.settings?.duration) return router.push({ name: mode.settingsRoute })
        gameStore.gameSettings = { mode: 'warmup', duration: row.settings.duration, zones }
        router.push({ name: 'warmup-game' })
      },
    }
  }
  if (mode.id === 'checkout') {
    return {
      ...base,
      title: mode.label,
      tags: ['Quiz noté'],
      metrics: [
        { value: `${row.correct_count}/${row.questions}`, label: 'réussis' },
        { value: row.points, label: 'points' },
      ],
      relaunch: () => {
        const { brackets, order } = row.settings ?? {}
        if (!brackets?.length) return router.push({ name: mode.settingsRoute })
        gameStore.gameSettings = { mode: 'checkout', variant: 'quiz', brackets, order, count: row.questions }
        router.push({ name: 'checkout-game' })
      },
    }
  }
  // 501: players and starter draw are chosen in the settings screen
  return {
    ...base,
    title: mode.label,
    action: 'Ouvrir les réglages',
    tags: [`${row.legs_played} manche${row.legs_played > 1 ? 's' : ''}`],
    metrics: [
      { value: row.avg_volley != null ? fmt1(row.avg_volley) : '–', label: 'moyenne / volée' },
      { value: row.highest_finish || '–', label: 'meilleur finish' },
    ],
    relaunch: () => router.push({ name: mode.settingsRoute }),
  }
})

// ── Per-mode footer line on the cards ───────────────────────────────────────
const cardStats = computed(() => {
  const { score, warmup, checkout, x01, tactics, tournament } = last.value
  const invites = onlineMatchStore.incomingInvites.length
  const thrown = x01.filter(r => r.avg_volley != null)
  return {
    'score-training': score && { label: 'Dernière', value: `${pct(score.correct_count, score.total_questions)} % juste` },
    warmup:           warmup && { label: 'Dernière', value: `${warmup.accuracy} % précision` },
    checkout:         checkout && { label: 'Dernière', value: `${checkout.correct_count} / ${checkout.questions} au quiz` },
    x01:              thrown.length && {
      label: 'Moyenne',
      value: `${fmt1(thrown.reduce((acc, r) => acc + Number(r.avg_volley), 0) / thrown.length)} / volée`,
    },
    'x01-online':     invites ? { label: `${invites} invitation${invites > 1 ? 's' : ''} en attente`, value: null } : null,
    tactics:          tactics
      ? { label: 'Dernière', value: `${fmt1(tactics.avg_darts)} fl. / manche` }
      : { label: 'Pas encore joué', value: null },
    tournament:       tournament && { label: 'En cours', value: tournament.name },
  }
})

const statOf = id => cardStats.value[id] || null
</script>

<template>
  <div class="lobby">
    <PageHeader title="Jouer">
      <button class="lobby__profile" :aria-label="`Profil de ${displayName}`" @click="router.push({ name: 'profile' })">
        <span class="lobby__profile-name">{{ displayName }}</span>
        <span class="lobby__avatar">{{ initials }}</span>
      </button>
    </PageHeader>

    <main class="lobby__main" :class="{ 'lobby__main--with-hero': lastSession }">
      <LastSessionHero
        v-if="lastSession"
        class="lobby__hero"
        v-bind="{ caption: lastSession.caption, duration: lastSession.duration, title: lastSession.title,
                  tags: lastSession.tags, metrics: lastSession.metrics, color: lastSession.color,
                  action: lastSession.action }"
        @relaunch="lastSession.relaunch"
        @stats="router.push({ name: 'stats' })"
      />

      <div class="lobby__groups">
        <section class="lobby__group">
          <SectionTitle title="S'entraîner" count="seul, à ton rythme" ruled />
          <div class="lobby__cards">
            <PlayModeCard
              v-for="mode in trainModes" :key="mode.id"
              :mode="mode" :description="mode.description"
              :stat-label="statOf(mode.id)?.label" :stat="statOf(mode.id)?.value"
              @select="router.push({ name: mode.settingsRoute })"
            />
            <PlayModeCard
              :mode="WIKI_TILE" outlined
              description="Toutes les sorties de 2 à 170, sans lancer de partie."
              stat-label="170 sorties"
              @select="router.push({ name: 'checkout-wiki' })"
            />
          </div>
        </section>

        <section class="lobby__group">
          <SectionTitle title="Jouer" count="partie complète" ruled />
          <div class="lobby__cards">
            <PlayModeCard
              v-for="mode in playModes" :key="mode.id"
              :mode="mode" :description="mode.description"
              :stat-label="statOf(mode.id)?.label" :stat="statOf(mode.id)?.value"
              @select="router.push({ name: mode.settingsRoute })"
            />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.lobby {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__profile {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    color: $bg;
  }

  &__profile-name {
    @include text-xs;
    font-weight: 600;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: $radius-pill;
    background: $error;
    @include title-sm;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-md $padding-md 0;
    @include nav-safe-bottom;
  }

  &__groups {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    min-width: 0;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }
}

@media (min-width: $bp-laptop) {
  .lobby {
    &__profile-name { @include text-sm; max-width: 200px; }
    &__avatar { width: 48px; height: 48px; @include title-lg; }
    &__profile { gap: $gap-sm; }

    &__main {
      padding: $padding-xxl $padding-xxl 0;
      gap: $gap-xxl;
      @include nav-safe-bottom($padding-xl);

      &--with-hero {
        display: grid;
        grid-template-columns: 380px minmax(0, 1fr);
        align-items: start;
      }
    }

    &__groups { gap: $gap-xl; }
    &__group { gap: $gap-sm; }

    &__cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: $gap-sm;
    }
  }
}
</style>
