<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBadgeStore } from '../store/badgeStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useTournamentStore } from '../store/tournamentStore.js'
import { GAME_MODES } from '../data/gameModes.js'
import { useProfileDisplay } from '../composables/useProfileDisplay.js'
import { weekActivity, dayStreak } from '../utils/activity.js'
import { recentResults } from '../utils/recentResults.js'
import HomeHeader from '../components/home/HomeHeader.vue'
import WeekActivity from '../components/home/WeekActivity.vue'
import HomeCta from '../components/home/HomeCta.vue'
import RecentResults from '../components/home/RecentResults.vue'
import SectionTitle from '../components/SectionTitle.vue'
import TournamentListCard from '../components/tournament/TournamentListCard.vue'
import RecentBadges from '../components/RecentBadges.vue'

// Optional mock props — only used by /dev to preview without auth
const props = defineProps({
  mockActivity:    { type: Array, default: null },
  mockBadges:      { type: Array, default: null },
  mockTournaments: { type: Array, default: null },
  // { score, warmup, checkout, x01 } — raw session rows
  mockSessions:    { type: Object, default: null },
})

const router          = useRouter()
const badgeStore      = useBadgeStore()
const dbStore         = useDbStore()
const tournamentStore = useTournamentStore()

const activity          = ref(props.mockActivity ?? [])
const userBadges        = ref(props.mockBadges ?? [])
const activeTournaments = ref(props.mockTournaments ?? [])
const sessions          = ref({ score: [], warmup: [], checkout: [], x01: [], ...props.mockSessions })

// Long enough to cover any realistic day streak
const ACTIVITY_DAYS = 365
const RESULTS_COUNT = 3

onMounted(() => {
  if (props.mockActivity) return
  const since = new Date(Date.now() - ACTIVITY_DAYS * 24 * 60 * 60 * 1000).toISOString()
  // Independent loads: a failing or slow request must not hold back the other sections
  badgeStore.fetchUserBadges().then((badges) => { userBadges.value = badges })
  tournamentStore.fetchActiveTournaments().then((tournaments) => { activeTournaments.value = tournaments })
  dbStore.fetchActivity(since).then((rows) => { activity.value = rows })
  dbStore.fetchGameSessions(RESULTS_COUNT).then((rows) => { sessions.value.score = rows })
  dbStore.fetchWarmupSessions(RESULTS_COUNT).then((rows) => { sessions.value.warmup = rows })
  dbStore.fetchCheckoutSessions(RESULTS_COUNT).then((rows) => { sessions.value.checkout = rows })
  dbStore.fetchX01Sessions(RESULTS_COUNT).then((rows) => { sessions.value.x01 = rows })
})

const { displayName, initials } = useProfileDisplay()

// The two entry tiles borrow the colour of their flagship mode
const colorOf   = (id) => GAME_MODES.find((m) => m.id === id).color
const playColor  = colorOf('x01')
const trainColor = colorOf('score-training')

const activityModes = new Set(['score-training', 'warmup', 'checkout', 'x01'])
const weekModes     = GAME_MODES.filter((m) => activityModes.has(m.id))

const week     = computed(() => weekActivity(activity.value))
const streak  = computed(() => dayStreak(activity.value))
const results = computed(() => recentResults(sessions.value, RESULTS_COUNT))

// The streak only needs saving until a session is logged today
const playedToday = computed(() => week.value.some((day) => day.isToday && Object.keys(day.counts).length))
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
        <section class="home__cta">
          <div class="home__cta-tiles">
            <HomeCta
              title="Jouer" description="Affronte tes amis ou un DartBot."
              icon="dartboard" :color="playColor"
              @select="router.push({ name: 'play', query: { filter: 'multi' } })"
            />
            <HomeCta
              title="S'entraîner" description="Calcul, échauffement, checkouts."
              icon="calculator" :color="trainColor"
              @select="router.push({ name: 'play', query: { filter: 'solo' } })"
            />
          </div>
          <p v-if="streak && !playedToday" class="home__streak">
            Joue aujourd'hui pour garder ta série de {{ streak }} jour{{ streak > 1 ? 's' : '' }}.
          </p>
        </section>

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
        <div class="home__pair">
          <RecentResults class="home__results" :results="results" @history="router.push({ name: 'stats' })" />
          <RecentBadges
            class="home__badges"
            :badges="userBadges"
            @badge-click="router.push({ name: 'badges' })"
            @view-all="router.push({ name: 'badges' })"
          />
        </div>
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

  // Mobile stacks the columns into one ordered list
  &__column,
  &__pair { display: contents; }

  &__week        { order: 1; }
  &__cta         { order: 2; }
  &__tournaments { order: 3; }
  &__results     { order: 4; }
  &__badges      { order: 5; }

  &__cta {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__cta-tiles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__streak {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include text-sm;
    color: $muted;

    &::before {
      content: '';
      width: 8px;
      height: 8px;
      flex-shrink: 0;
      border-radius: $radius-pill;
      background: $error;
    }
  }

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
      grid-template-columns: 500px minmax(0, 1fr);
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

    &__pair {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: $gap-xl;
    }

    // Columns are real flex containers here: the mobile stacking order no longer applies
    &__week,
    &__cta,
    &__tournaments,
    &__results,
    &__badges { order: 0; }

    &__cta-tiles { gap: $gap-sm; }
    &__streak { @include text-md; }
  }
}
</style>
