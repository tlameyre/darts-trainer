import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useAuthStore } from './authStore.js'

export const useFriendStore = defineStore('friend', () => {
  const friends         = ref([])
  const pendingReceived = ref([])
  const pendingSent     = ref([])
  const loading         = ref(false)

  let channel = null

  function getUser() {
    return useAuthStore().user
  }

  // ── Fetch all relationships for current user ──────────────────────────────

  async function fetchFriends() {
    const user = getUser()
    if (!user) return
    loading.value = true

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id, status, created_at,
        requester:requester_id ( id, username, first_name, last_name, friend_code ),
        addressee:addressee_id ( id, username, first_name, last_name, friend_code )
      `)
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    if (error) {
      console.error('[friendStore] fetchFriends:', error.message)
      loading.value = false
      return
    }

    const accepted = []
    const received = []
    const sent     = []

    for (const row of data ?? []) {
      const isRequester = row.requester.id === user.id
      const other = isRequester ? row.addressee : row.requester

      if (row.status === 'accepted') {
        accepted.push({ friendshipId: row.id, ...other })
      } else if (row.status === 'pending') {
        if (isRequester) {
          sent.push({ friendshipId: row.id, ...other })
        } else {
          received.push({ friendshipId: row.id, ...other })
        }
      }
    }

    friends.value         = accepted
    pendingReceived.value = received
    pendingSent.value     = sent
    loading.value         = false
  }

  // ── Send a friend request by friend_code ─────────────────────────────────

  async function sendRequest(friendCode) {
    const user = getUser()
    if (!user) return { error: 'Non connecté' }

    const code = friendCode.trim().toUpperCase()

    const { data: target, error: lookupError } = await supabase
      .from('profiles')
      .select('id, username, first_name')
      .eq('friend_code', code)
      .single()

    if (lookupError || !target) return { error: 'Code ami introuvable' }
    if (target.id === user.id)  return { error: 'Tu ne peux pas t\'ajouter toi-même' }

    // Check no existing relationship
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),` +
        `and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle()

    if (existing) {
      if (existing.status === 'accepted') return { error: 'Vous êtes déjà amis' }
      return { error: 'Une demande est déjà en cours' }
    }

    const { error: insertError } = await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: target.id,
    })

    if (insertError) return { error: insertError.message }

    await fetchFriends()
    return { success: true, name: target.first_name || target.username || code }
  }

  // ── Search users by username or first_name ───────────────────────────────

  async function searchUsers(query) {
    const user = getUser()
    if (!user || !query.trim()) return []

    const q = query.trim()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, friend_code')
      .or(`username.ilike.%${q}%,first_name.ilike.%${q}%`)
      .neq('id', user.id)
      .limit(10)

    if (error) {
      console.error('[friendStore] searchUsers:', error.message)
      return []
    }
    return data ?? []
  }

  // ── Accept a received request ─────────────────────────────────────────────

  async function acceptRequest(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
    if (error) console.error('[friendStore] acceptRequest:', error.message)
    else await fetchFriends()
  }

  // ── Decline / remove a friendship ─────────────────────────────────────────

  async function removeFriendship(friendshipId) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
    if (error) console.error('[friendStore] removeFriendship:', error.message)
    else await fetchFriends()
  }

  // ── Realtime subscription ─────────────────────────────────────────────────

  function subscribeToFriendships() {
    const user = getUser()
    if (!user || channel) return

    channel = supabase
      .channel('friendships-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        fetchFriends()
      })
      .subscribe()
  }

  function unsubscribeFromFriendships() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  return {
    friends, pendingReceived, pendingSent, loading,
    fetchFriends, sendRequest, acceptRequest, removeFriendship, searchUsers,
    subscribeToFriendships, unsubscribeFromFriendships,
  }
})
