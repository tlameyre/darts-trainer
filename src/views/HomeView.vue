<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useTournamentStore } from '../store/tournamentStore.js'
import { GAME_MODES } from '../data/gameModes.js'
import { weekActivity, dayStreak } from '../utils/activity.js'
import HomeHeader from '../components/home/HomeHeader.vue'
import WeekActivity from '../components/home/WeekActivity.vue'
import ModeSection from '../components/home/ModeSection.vue'
import SectionTitle from '../components/SectionTitle.vue'
import TournamentListCard from '../components/tournament/TournamentListCard.vue'
import RecentBadges from '../components/RecentBadges.vue'

// Optional mock props — only used by /dev to preview without auth
const props = defineProps({
  mockActivity:    { type: Array, default: null },
  mockBadges:      { type: Array, default: null },
  mockTournaments: { type: Array, default: null },
})

const router          = useRouter()
const authStore       = useAuthStore()
const badgeStore      = useBadgeStore()
const dbStore         = useDbStore()
const tournamentStore = useTournamentStore()

const activity          = ref(props.mockActivity ?? [])
const userBadges        = ref(props.mockBadges ?? [])
const activeTournaments = ref(props.mockTournaments ?? [])

// Long enough to cover any realistic day streak
const ACTIVITY_DAYS = 365

onMounted(() => {
  if (props.mockActivity) return
  const since = new Date(Date.now() - ACTIVITY_DAYS * 24 * 60 * 60 * 1000).toISOString()
  // Independent loads: a failing or slow request must not hold back the other sections
  badgeStore.fetchUserBadges().then((badges) => { userBadges.value = badges })
  tournamentStore.fetchActiveTournaments().then((tournaments) => { activeTournaments.value = tournaments })
  dbStore.fetchActivity(since).then((sessions) => { activity.value = sessions })
})

const displayName = computed(() => {
  const p = authStore.profile
  if (!p) return 'Joueur'
  return p.first_name || p.username || 'Joueur'
})

const initials = computed(() => {
  const p = authStore.profile
  if (!p) return '?'
  if (p.first_name || p.last_name) {
    return [(p.first_name?.[0] ?? ''), (p.last_name?.[0] ?? '')].join('').toUpperCase()
  }
  return (p.username?.[0] ?? authStore.user?.email?.[0] ?? '?').toUpperCase()
})

const WIKI_TILE = { id: 'checkout-wiki', label: 'Encyclopédie', icon: 'book', color: '#14110F', settingsRoute: 'checkout-wiki' }

const trainModes = [...GAME_MODES.filter((m) => m.group === 'train'), WIKI_TILE]
const playModes  = GAME_MODES.filter((m) => m.group !== 'train')

const activityModes = new Set(['score-training', 'warmup', 'checkout', 'x01'])
const weekModes     = GAME_MODES.filter((m) => activityModes.has(m.id))

const week   = computed(() => weekActivity(activity.value))
const streak = computed(() => dayStreak(activity.value))
</script>

<template>
  <div class="home">
    <HomeHeader
      :name="displayName"
      :initials="initials"
      :streak="streak"
      @profile="router.push({ name: 'profile' })"
    />

    <main class="home__main">
      <div class="home__column">
        <ModeSection
          class="home__train"
          title="S'entraîner"
          :modes="trainModes"
          @select="mode => router.push({ name: mode.settingsRoute })"
        />
        <ModeSection
          class="home__play"
          title="Jouer"
          :modes="playModes"
          @select="mode => router.push({ name: mode.settingsRoute })"
        />

        <section v-if="activeTournaments.length" class="home__tournaments">
          <SectionTitle title="Tournois en cours" action="Voir tout" @action="router.push({ name: 'tournaments' })" />
          <div class="home__tournament-list">
            <TournamentListCard
              v-for="t in activeTournaments" :key="t.id"
              :tournament="t"
              @click="router.push({ name: 'tournament-detail', params: { id: t.id } })"
            />
          </div>
        </section>
      </div>

      <div class="home__column home__column--aside">
        <WeekActivity class="home__week" :days="week" :modes="weekModes" />
        <RecentBadges
          class="home__badges"
          :badges="userBadges"
          @badge-click="router.push({ name: 'badges' })"
          @view-all="router.push({ name: 'badges' })"
        />
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  @include nav-safe-bottom;

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
    padding: $padding-lg $padding-md 0;
  }

  // Mobile stacks both columns into one ordered list
  &__column { display: contents; }

  &__week        { order: 1; }
  &__train       { order: 2; }
  &__play        { order: 3; }
  &__tournaments { order: 4; }
  &__badges      { order: 5; }

  &__tournaments {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__tournament-list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }
}

@media (min-width: $bp-laptop) {
  .home {
    @include nav-safe-bottom($padding-xxl);

    &__main {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 420px;
      align-items: start;
      gap: $gap-xxl;
      padding: $padding-xxl $padding-xxl 0;
    }

    &__column {
      display: flex;
      flex-direction: column;
      gap: $gap-xl;
      min-width: 0;
    }

    &__tournament-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $gap-sm;
    }
  }
}
</style>
