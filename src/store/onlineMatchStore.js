import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useDbStore } from './dbStore.js'
import { useAuthStore } from './authStore.js'

export function profileName(profile) {
  return profile?.username ?? profile?.first_name ?? 'Joueur'
}

export const useOnlineMatchStore = defineStore('onlineMatch', () => {
  // Matchs 'invited' ou 'active' où l'utilisateur est hôte ou invité
  const openMatches = ref([])
  let channel = null

  function myId() {
    return useAuthStore().user?.id ?? null
  }

  const incomingInvites = computed(() =>
    openMatches.value.filter(m => m.status === 'invited' && m.guest_id === myId())
  )
  const activeMatches = computed(() => openMatches.value.filter(m => m.status === 'active'))

  async function fetchOpenMatches() {
    openMatches.value = await useDbStore().fetchOpenOnlineMatches()
  }

  function subscribeToOpenMatches() {
    if (!myId() || channel) return
    channel = supabase
      .channel('online-matches-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'online_matches' }, () => {
        fetchOpenMatches()
      })
      .subscribe()
  }

  function unsubscribeFromOpenMatches() {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    openMatches.value = []
  }

  // starter : 'me' | 'opponent' | 'random' — l'ordre de players fait foi pour les deux clients
  async function invite({ guest, startScore, legsToWin, starter = 'random', tournament = null }) {
    const me = { id: myId(), name: profileName(useAuthStore().profile) }
    const opponent = { id: guest.id, name: guest.name }
    if (tournament) {
      me.participantId       = tournament.myParticipantId
      opponent.participantId = tournament.opponentParticipantId
    }
    const meFirst = starter === 'random' ? Math.random() < 0.5 : starter === 'me'
    const players = meFirst ? [me, opponent] : [opponent, me]
    const match = await useDbStore().createOnlineMatch({
      guestId:           guest.id,
      settings:          { startScore, legsToWin, players, tournamentId: tournament?.tournamentId ?? null },
      tournamentMatchId: tournament?.matchId ?? null,
    })
    if (match) await fetchOpenMatches()
    return match
  }

  async function setStatus(matchId, fromStatus, status) {
    const updated = await useDbStore().updateOnlineMatchStatus(matchId, fromStatus, { status })
    await fetchOpenMatches()
    return updated
  }

  const accept  = (matchId) => setStatus(matchId, 'invited', 'active')
  const decline = (matchId) => setStatus(matchId, 'invited', 'declined')
  const cancel  = (matchId) => setStatus(matchId, 'invited', 'cancelled')

  function opponentOf(match) {
    return match.host_id === myId() ? match.guest : match.host
  }

  // Pure : objet à assigner à gameStore.gameSettings pour lancer / reprendre le match
  function buildGameSettings(match) {
    const me = myId()
    const { startScore, legsToWin, players, tournamentId } = match.settings
    return {
      mode:       'x01',
      startScore,
      legsToWin,
      aiProfile:  null,
      players:    players.map(p => p.id === me ? { ...p, isMe: true } : { ...p, isFriend: !match.tournament_match_id }),
      online:     { matchId: match.id },
      ...(match.tournament_match_id
        ? { tournamentContext: { tournamentId, matchId: match.tournament_match_id } }
        : {}),
    }
  }

  return {
    openMatches, incomingInvites, activeMatches,
    fetchOpenMatches, subscribeToOpenMatches, unsubscribeFromOpenMatches,
    invite, accept, decline, cancel, opponentOf, buildGameSettings,
  }
})
