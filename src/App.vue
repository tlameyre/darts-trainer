<script setup>
import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIconDefs from './components/AppIconDefs.vue'
import BottomNav from './components/BottomNav.vue'
import OnlineMatchBanner from './components/OnlineMatchBanner.vue'
import OnlineChallengeHost from './components/online/OnlineChallengeHost.vue'
import { useAuthStore } from './store/authStore.js'
import { useFriendStore } from './store/friendStore.js'
import { useTournamentStore } from './store/tournamentStore.js'
import { useOnlineMatchStore } from './store/onlineMatchStore.js'

const router          = useRouter()
const route           = useRoute()
const authStore       = useAuthStore()
const friendStore     = useFriendStore()
const tournamentStore = useTournamentStore()
const onlineMatchStore = useOnlineMatchStore()

watch(() => authStore.isAuth, (val) => {
  if (route.meta.dev) return
  if (!val) {
    friendStore.unsubscribeFromFriendships()
    tournamentStore.unsubscribeFromMyParticipations()
    onlineMatchStore.unsubscribeFromOpenMatches()
    router.replace({ name: 'login' })
  } else {
    friendStore.fetchFriends()
    friendStore.subscribeToFriendships()
    tournamentStore.fetchMyParticipations()
    tournamentStore.subscribeToMyParticipations()
    onlineMatchStore.fetchOpenMatches()
    onlineMatchStore.subscribeToOpenMatches()
    if (route.meta.public) router.replace({ name: 'home' })
  }
})
</script>

<template>
  <AppIconDefs />
  <RouterView />
  <OnlineChallengeHost v-if="authStore.isAuth && !route.meta.public && route.name !== 'online-match' && !String(route.name).endsWith('-game')" />
  <template v-if="authStore.isAuth && !route.meta.hideNav && !route.meta.public">
    <OnlineMatchBanner v-if="route.name !== 'online-match'" />
    <BottomNav :class="{ 'bottom-nav--no-desktop': route.meta.hideNavDesktop }" />
  </template>
</template>
