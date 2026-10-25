<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOnlineMatchStore, profileName } from '../../store/onlineMatchStore.js'
import { useAuthStore } from '../../store/authStore.js'
import { useDbStore } from '../../store/dbStore.js'
import { matchTone } from '../../utils/matchTone.js'
import { roundLabel } from '../../utils/tournamentRound.js'
import OnlineChallengeAlert from './OnlineChallengeAlert.vue'

const router           = useRouter()
const onlineMatchStore = useOnlineMatchStore()
const authStore        = useAuthStore()
const dbStore          = useDbStore()

// Challenges the user postponed stay reachable through the banner
const dismissed = ref(new Set())
const busy      = ref(false)

const invite = computed(() => onlineMatchStore.incomingInvites.find(m => !dismissed.value.has(m.id)) ?? null)

const tournamentLabel = ref(null)
watch(() => invite.value?.id, async () => {
  tournamentLabel.value = null
  const tournamentMatchId = invite.value?.tournament_match_id
  if (!tournamentMatchId) return
  const label = await dbStore.fetchTournamentMatchLabel(tournamentMatchId)
  if (label && invite.value?.tournament_match_id === tournamentMatchId) {
    tournamentLabel.value = { name: label.name, round: roundLabel(label) }
  }
}, { immediate: true })

const tone = computed(() => matchTone({ online: true, tournament: !!invite.value?.tournament_match_id }))

function later() {
  dismissed.value = new Set([...dismissed.value, invite.value.id])
}

async function accept() {
  const id = invite.value.id
  busy.value = true
  await onlineMatchStore.accept(id)
  busy.value = false
  router.push({ name: 'online-match', params: { id } })
}

async function decline() {
  busy.value = true
  await onlineMatchStore.decline(invite.value.id)
  busy.value = false
}
</script>

<template>
  <OnlineChallengeAlert
    v-if="invite"
    :opponent-name="profileName(invite.host)"
    :my-name="profileName(authStore.profile)"
    :start-score="invite.settings.startScore"
    :legs-to-win="invite.settings.legsToWin"
    :tone="tone"
    :tournament="invite.tournament_match_id ? (tournamentLabel ?? { name: '…', round: 'Tournoi' }) : null"
    :busy="busy"
    @accept="accept"
    @later="later"
    @decline="decline"
  />
</template>
