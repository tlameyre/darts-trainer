import { ref, watch } from 'vue'
import { useAuthStore } from '../store/authStore.js'

// Players list of a settings screen: "me" (reorderable like the others) + added friends/guests
export function usePlayerSetup() {
  const authStore = useAuthStore()

  const players = ref([
    { id: 'me', name: authStore.profile?.username ?? 'Toi', isMe: true },
  ])

  // The profile can load after the view is mounted
  watch(() => authStore.profile, (profile) => {
    const me = players.value.find(p => p.isMe)
    if (me && profile?.username) me.name = profile.username
  })

  return { players }
}
