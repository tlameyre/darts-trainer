<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useProfileDisplay } from '../composables/useProfileDisplay.js'
import { useFriendStore } from '../store/friendStore.js'
import BadgeDetailModal from '../components/badges/BadgeDetailModal.vue'
import ProfileFriendsSection from '../components/friends/ProfileFriendsSection.vue'
import ProfileHero from '../components/profile/ProfileHero.vue'
import AppButton from '../components/AppButton.vue'
import RecentBadges from '../components/RecentBadges.vue'

// Optional mock data — only used by /dev to preview without auth
// { profile: { first_name, last_name, username }, stats, friends: [], pendingCount, badges: [] }
const props = defineProps({
  mockData: { type: Object, default: null },
})

const router      = useRouter()
const authStore   = useAuthStore()
const dbStore     = useDbStore()
const badgeStore  = useBadgeStore()
const friendStore = useFriendStore()
const { getBadgeProgress } = badgeStore
const { initials } = useProfileDisplay()

const stats          = ref(props.mockData?.stats ?? null)
const userBadges     = ref(props.mockData?.badges ?? [])
const selectedBadge  = ref(null)
const showBadgeModal = ref(false)

onMounted(async () => {
  if (props.mockData) return
  const [s, b] = await Promise.all([
    dbStore.fetchProfileStats(),
    badgeStore.fetchUserBadges(),
    friendStore.fetchFriends(),
  ])
  stats.value      = s
  userBadges.value = b
})

const selectedProgress = computed(() =>
  selectedBadge.value && !selectedBadge.value.unlockedAt
    ? getBadgeProgress(selectedBadge.value.id, stats.value)
    : null
)

function openBadge(badge) {
  selectedBadge.value  = badge
  showBadgeModal.value = true
}

const profile = computed(() => props.mockData?.profile ?? authStore.profile)
const friends = computed(() => props.mockData?.friends ?? friendStore.friends)
const pendingCount = computed(() => props.mockData?.pendingCount ?? friendStore.pendingReceived.length)

const fullName = computed(() => {
  const p = profile.value
  if (!p) return '—'
  const full = [p.first_name, p.last_name].filter(Boolean).join(' ')
  return full || p.username || authStore.user?.email || '—'
})

const darts = computed(() => stats.value?.totalDarts?.toLocaleString('fr-FR') ?? '—')

async function onSignOut() {
  await authStore.signOut()
  router.replace({ name: 'login' })
}
</script>


<template>
  <div class="profile">
    <ProfileHero
      :initials="mockData ? `${profile.first_name[0]}${profile.last_name[0]}` : initials"
      :name="fullName"
      :username="profile?.username"
      :sessions="stats?.totalSessions ?? '—'"
      :darts="darts"
      :accuracy="stats?.avgAccuracy ?? null"
      @edit="router.push({ name: 'profile-edit' })"
    />

    <main class="profile__main">
      <ProfileFriendsSection
        class="profile__friends"
        :friends="friends"
        :pending-count="pendingCount"
        @see-all="router.push({ name: 'friends' })"
      />

      <RecentBadges
        class="profile__badges"
        ruled
        :badges="userBadges"
        empty-text="Joue ta première partie pour débloquer des badges."
        @badge-click="openBadge"
        @view-all="router.push({ name: 'badges' })"
      />

      <AppButton class="profile__logout" variant="secondary" tone="danger" icon="exit" @click="onSignOut">Se déconnecter</AppButton>
    </main>

    <BadgeDetailModal
      :show="showBadgeModal"
      :badge="selectedBadge"
      :progress="selectedProgress"
      @close="showBadgeModal = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.profile {
  min-height: 100dvh;

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
    padding: $padding-lg $padding-md 0;
    @include nav-safe-bottom;
  }
}

@media (min-width: $bp-laptop) {
  .profile {
    &__main {
      display: grid;
      grid-template-columns: 440px minmax(0, 1fr);
      grid-template-areas:
        'friends badges'
        'logout  badges';
      align-content: start;
      gap: $gap-lg $gap-xxl;
      padding: $padding-xxl $padding-xxl 0;
      @include nav-safe-bottom($padding-xl);
    }

    &__friends { grid-area: friends; }
    &__badges  { grid-area: badges; }
    &__logout  { grid-area: logout; }
  }
}
</style>
