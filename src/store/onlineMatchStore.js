import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useDbStore } from './dbStore.js'
import { useAuthStore } from './authStore.js'

export function profileName(profile) {
  return profile?.username ?? profile?.first_name ?? 'Joueur'
}

export const useOnlineMatchStore = defineStore('onlineMatch', () => {
  // Matchs 'invited', 'accepted' ou 'active' où l'utilisateur est hôte ou invité
  const openMatches = ref([])
  let channel = null

  function myId() {
    return useAuthStore().user?.id ?? null
  }

  const incomingInvites = computed(() =>
    openMatches.value.filter(m => m.status === 'invited' && m.guest_id === myId())
  )
  // Accepté : les joueurs font le bull, l'hôte doit désigner qui commence
  const acceptedMatches = computed(() => openMatches.value.filter(m => m.status === 'accepted'))
  const activeMatches   = computed(() => openMatches.value.filter(m => m.status === 'active'))

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

  // L'ordre de players est provisoire : l'hôte le fixe après le bull (chooseStarter)
  async function invite({ guest, startScore, legsToWin, tournament = null }) {
    const me = { id: myId(), name: profileName(useAuthStore().profile) }
    const opponent = { id: guest.id, name: guest.name }
    if (tournament) {
      me.participantId       = tournament.myParticipantId
      opponent.participantId = tournament.opponentParticipantId
    }
    const players = [me, opponent]
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

  const accept  = (matchId) => setStatus(matchId, 'invited', 'accepted')
  const decline = (matchId) => setStatus(matchId, 'invited', 'declined')
  const cancel  = (matchId, fromStatus = 'invited') => setStatus(matchId, fromStatus, 'cancelled')

  async function chooseStarter(matchId, starterId) {
    const updated = await useDbStore().startOnlineMatch(matchId, starterId)
    await fetchOpenMatches()
    return updated
  }

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
    openMatches, incomingInvites, acceptedMatches, activeMatches,
    fetchOpenMatches, subscribeToOpenMatches, unsubscribeFromOpenMatches,
    invite, accept, decline, cancel, chooseStarter, opponentOf, buildGameSettings,
  }
})
