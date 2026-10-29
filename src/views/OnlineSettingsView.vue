<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '../store/friendStore.js'
import { useOnlineMatchStore, profileName } from '../store/onlineMatchStore.js'
import AppIcon from '../components/AppIcon.vue'
import OptionSelector from '../components/OptionSelector.vue'
import AppButton from '../components/AppButton.vue'
import SettingsLayout from '../components/settings/SettingsLayout.vue'
import SettingsSection from '../components/settings/SettingsSection.vue'
import LegsStepper from '../components/settings/LegsStepper.vue'
import DashedAddButton from '../components/settings/DashedAddButton.vue'
import OnlineFriendRow from '../components/online/OnlineFriendRow.vue'

const props = defineProps({
  // Preview /dev uniquement : liste d'amis fictive
  mockFriends: { type: Array, default: null },
})

const router           = useRouter()
const friendStore      = useFriendStore()
const onlineMatchStore = useOnlineMatchStore()

const SCORE_OPTIONS = [101, 301, 501].map(value => ({ value, label: String(value) }))

const startScore = ref(501)
const legsToWin  = ref(2)
const opponentId = ref(null)
const inviting   = ref(false)

const PRINCIPLE = {
  text: 'Défie un ami : même partie de 501, chacun lance depuis son propre appareil.',
  chips: ['501', 'En ligne', 'Défi'],
}

const friends  = computed(() => props.mockFriends ?? friendStore.friends)
const opponent = computed(() => friends.value.find(f => f.id === opponentId.value) ?? null)

const recap = computed(() => [
  String(startScore.value),
  `${legsToWin.value} manche${legsToWin.value > 1 ? 's' : ''}`,
  ...(opponent.value ? [`vs ${profileName(opponent.value)}`] : []),
])

// Défi déjà envoyé / reçu / en cours avec cet ami → on renvoie vers sa salle d'attente
function openMatchWith(friendId) {
  return onlineMatchStore.openMatches.find(m =>
    !m.tournament_match_id && (m.host_id === friendId || m.guest_id === friendId)
  ) ?? null
}

const STATUS_LABELS = { invited: 'Défi en attente', accepted: 'Bull en cours', active: 'Match en cours' }

function statusOf(friendId) {
  const open = openMatchWith(friendId)
  return open ? STATUS_LABELS[open.status] : ''
}

function selectFriend(friend) {
  const open = openMatchWith(friend.id)
  if (open) router.push({ name: 'online-match', params: { id: open.id } })
  else opponentId.value = friend.id
}

async function challenge() {
  if (!opponent.value || inviting.value) return
  inviting.value = true
  const match = await onlineMatchStore.invite({
    guest:      { id: opponent.value.id, name: profileName(opponent.value) },
    startScore: startScore.value,
    legsToWin:  legsToWin.value,
  })
  inviting.value = false
  if (match) router.push({ name: 'online-match', params: { id: match.id } })
}

onMounted(() => {
  if (!props.mockFriends) friendStore.fetchFriends()
})
</script>

<template>
  <SettingsLayout title="501 en ligne" tone="online" :principle="PRINCIPLE" :recap="recap">
    <SettingsSection label="Adversaire" hint="Un ami, sur son appareil" role="radiogroup" aria-label="Adversaire">
      <OnlineFriendRow
        v-for="f in friends" :key="f.id"
        :id="f.id"
        :name="profileName(f)"
        :code="f.friend_code"
        :status="statusOf(f.id)"
        :selected="f.id === opponentId"
        @click="selectFriend(f)"
      />

      <DashedAddButton @click="router.push({ name: 'friends' })">Ajouter un ami</DashedAddButton>
    </SettingsSection>

    <template #side>
      <OptionSelector v-model="startScore" label="Score de départ" :options="SCORE_OPTIONS" tone="online" />

      <LegsStepper v-model="legsToWin" />

      <p class="online-note">
        <AppIcon name="globe" :width="18" :height="18" class="online-note__icon" />
        {{ opponent ? profileName(opponent) : 'Ton ami' }} reçoit le défi sur son appareil.
        Une fois accepté, tu choisis qui commence : au bull ou au hasard.
      </p>
    </template>

    <template #start>
      <AppButton size="cta" icon-end="arrow-right" tone="online" :disabled="!opponent || inviting" @click="challenge">
        {{ opponent ? `Défier ${profileName(opponent)}` : 'Choisis un adversaire' }}
      </AppButton>
    </template>
  </SettingsLayout>
</template>

<style lang="scss" scoped>
.online-note {
  @include text-xs;
  display: flex;
  gap: $gap-xs;
  padding: $padding-sm;
  border-radius: $radius-sm;
  background: $surface;
  color: $muted;

  &__icon {
    flex-shrink: 0;
    color: $mode-online;
  }
}

@media (min-width: $bp-laptop) {
  .online-note { @include text-sm; }
}
</style>
