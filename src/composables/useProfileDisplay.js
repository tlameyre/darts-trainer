import { computed } from 'vue'
import { useAuthStore } from '../store/authStore.js'

// Name and initials shown in the page headers (home, play)
export function useProfileDisplay() {
  const authStore = useAuthStore()

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

  return { displayName, initials }
}
