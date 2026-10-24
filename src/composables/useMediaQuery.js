import { ref, onMounted, onBeforeUnmount } from 'vue'

// Reactive window.matchMedia, for layouts that change structure (not just style)
export function useMediaQuery(query) {
  const mql = window.matchMedia(query)
  const matches = ref(mql.matches)
  const update = (e) => { matches.value = e.matches }

  onMounted(() => mql.addEventListener('change', update))
  onBeforeUnmount(() => mql.removeEventListener('change', update))

  return matches
}
