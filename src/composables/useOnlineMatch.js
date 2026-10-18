import { ref, computed, watch, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useDbStore } from '../store/dbStore.js'

/**
 * Synchronise une partie X01 (useX01) avec un match en ligne.
 *
 * Source de vérité = online_match_events, rejoué dans l'ordre de seq. Le joueur actif
 * saisit localement avec useX01 ; chaque volée définitive est publiée (publishVolley,
 * branché sur onVolleyCommitted) puis appliquée chez l'adversaire via applyVolley.
 * En cas de trou ou de conflit de seq, on reconstruit tout depuis le journal.
 *
 * @param {{ matchId: string, myId: string, players: Array, x01: object }} options
 */
export function useOnlineMatch({ matchId, myId, players, x01 }) {
  const dbStore = useDbStore()

  const match          = ref(null)
  const loading        = ref(true)
  const opponentOnline = ref(false)
  // Fléchettes de la volée en cours de l'adversaire (broadcast, non persisté)
  const liveDarts      = ref([])
  // Volées actuellement appliquées, dans l'ordre (un undo retire la dernière)
  const volleyStack    = ref([])

  let lastSeq = 0
  let channel = null
  let hasSubscribed = false

  const meIndex = players.findIndex(p => p.id === myId)
  const playerIndexOf = (id) => players.findIndex(p => p.id === id)

  const isActive = computed(() => match.value?.status === 'active')
  const isMyTurn = computed(() =>
    !loading.value && isActive.value && x01.currentPlayerIndex.value === meIndex
  )

  // Undo distant : seulement sa propre dernière volée, si l'adversaire n'a pas encore
  // joué derrière et si elle n'a pas fini la manche
  const canUndoRemote = computed(() => {
    const top = volleyStack.value[volleyStack.value.length - 1]
    return isActive.value
      && !!top
      && top.player_id === myId
      && top.payload.volley.dartsToFinish == null
      && !x01.legClosed.value
  })

  function applyEvent(event) {
    lastSeq = event.seq
    const idx = playerIndexOf(event.player_id)
    if (idx < 0) return
    if (event.type === 'volley') {
      x01.applyVolley(idx, event.payload.volley)
      volleyStack.value = [...volleyStack.value, event]
    } else if (event.type === 'undo') {
      x01.removeLastVolley(idx)
      volleyStack.value = volleyStack.value.slice(0, -1)
    }
    liveDarts.value = []
  }

  async function resync() {
    const events = await dbStore.fetchOnlineMatchEvents(matchId)
    if (!events) return
    if (!loading.value && (events[events.length - 1]?.seq ?? 0) === lastSeq) return
    x01.resetMatch()
    volleyStack.value = []
    lastSeq = 0
    events.forEach(applyEvent)
  }

  async function refreshMatch() {
    const fresh = await dbStore.fetchOnlineMatch(matchId)
    if (fresh) match.value = fresh
  }

  function handleRemoteEvent(event) {
    if (event.seq <= lastSeq) return // écho de nos propres inserts, déjà appliqués
    if (event.seq !== lastSeq + 1) {
      resync()
      return
    }
    applyEvent(event)
  }

  function subscribe() {
    channel = supabase
      .channel(`online-match-${matchId}`, { config: { presence: { key: myId } } })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'online_match_events', filter: `match_id=eq.${matchId}`,
      }, ({ new: event }) => handleRemoteEvent(event))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'online_matches', filter: `id=eq.${matchId}`,
      }, () => refreshMatch())
      .on('broadcast', { event: 'darts' }, ({ payload }) => {
        if (payload.playerId !== myId) liveDarts.value = payload.darts
      })
      .on('presence', { event: 'sync' }, () => {
        opponentOnline.value = Object.keys(channel.presenceState()).some(key => key !== myId)
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return
        channel.track({ online: true })
        // Reconnexion après une coupure : des events ont pu être manqués
        if (hasSubscribed) {
          resync()
          refreshMatch()
        }
        hasSubscribed = true
      })
  }

  async function publish(type, payload) {
    const seq = lastSeq + 1
    lastSeq = seq
    const ok = await dbStore.insertOnlineMatchEvent({ matchId, seq, type, payload })
    if (!ok) {
      await resync()
      return null
    }
    return { seq, player_id: myId, type, payload }
  }

  async function publishVolley({ playerIndex, volley }) {
    if (playerIndex !== meIndex || !isActive.value) return
    const event = await publish('volley', { volley })
    if (event) volleyStack.value = [...volleyStack.value, event]
  }

  async function publishUndo() {
    if (!canUndoRemote.value) return
    const event = await publish('undo', {})
    if (!event) return
    x01.removeLastVolley(meIndex)
    volleyStack.value = volleyStack.value.slice(0, -1)
  }

  async function complete(winnerId) {
    const updated = await dbStore.updateOnlineMatchStatus(matchId, 'active', { status: 'completed', winnerId })
    if (updated) match.value = updated
    else await refreshMatch()
  }

  async function forfeit() {
    const opponent = players.find(p => p.id !== myId)
    const updated = await dbStore.updateOnlineMatchStatus(matchId, 'active', { status: 'abandoned', winnerId: opponent.id })
    if (updated) match.value = updated
  }

  watch(x01.currentDarts, (darts) => {
    if (channel && isMyTurn.value) {
      channel.send({ type: 'broadcast', event: 'darts', payload: { playerId: myId, darts } })
    }
  })

  // Sur mobile, l'app en arrière-plan perd le socket sans toujours le signaler
  function handleVisibility() {
    if (document.visibilityState === 'visible') {
      resync()
      refreshMatch()
    }
  }

  async function start() {
    await refreshMatch()
    await resync()
    loading.value = false
    subscribe()
    document.addEventListener('visibilitychange', handleVisibility)
  }

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibility)
    if (channel) supabase.removeChannel(channel)
  })

  start()

  return {
    match, loading, isActive, isMyTurn, opponentOnline, liveDarts, canUndoRemote,
    publishVolley, publishUndo, complete, forfeit,
  }
}
