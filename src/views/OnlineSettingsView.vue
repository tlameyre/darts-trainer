<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '../store/friendStore.js'
import { useOnlineMatchStore, profileName } from '../store/onlineMatchStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import OptionSelector from '../components/OptionSelector.vue'
import StartButton from '../components/StartButton.vue'
import OnlineFriendRow from '../components/online/OnlineFriendRow.vue'

const props = defineProps({
  // Preview /dev uniquement : liste d'amis fictive
  mockFriends: { type: Array, default: null },
})

const router           = useRouter()
const friendStore      = useFriendStore()
const onlineMatchStore = useOnlineMatchStore()

const SCORE_OPTIONS = [101, 301, 501].map(value => ({ value, label: String(value) }))
const MIN_LEGS      = 1
const MAX_LEGS      = 9

const startScore = ref(501)
const legsToWin  = ref(2)
const opponentId = ref(null)
const inviting   = ref(false)

const friends  = computed(() => props.mockFriends ?? friendStore.friends)
const opponent = computed(() => friends.value.find(f => f.id === opponentId.value) ?? null)

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
  <div class="online-settings">
    <AppHeader title="501 en ligne" tone="online" @back="router.push({ name: 'play' })" />

    <main class="online-settings__main">
      <div class="online-settings__col">
        <section class="online-settings__section" role="radiogroup" aria-label="Adversaire">
          <div class="online-settings__head">
            <h2 class="online-settings__label">Adversaire</h2>
            <span class="online-settings__hint">Un ami, sur son appareil</span>
          </div>

          <OnlineFriendRow
            v-for="f in friends" :key="f.id"
            :id="f.id"
            :name="profileName(f)"
            :code="f.friend_code"
            :status="statusOf(f.id)"
            :selected="f.id === opponentId"
            @click="selectFriend(f)"
          />

          <button class="online-settings__add" @click="router.push({ name: 'friends' })">
            <AppIcon name="user-plus" :width="18" :height="18" />Ajouter un ami
          </button>
        </section>
      </div>

      <div class="online-settings__col online-settings__col--side">
        <OptionSelector v-model="startScore" label="Score de départ" :options="SCORE_OPTIONS" tone="online" />

        <section class="online-settings__section">
          <div class="online-settings__head">
            <h2 class="online-settings__label">Manches à gagner</h2>
            <span class="online-settings__hint">Premier à {{ legsToWin }} manche{{ legsToWin > 1 ? 's' : '' }}</span>
          </div>
          <div class="online-settings__stepper">
            <button
              class="online-settings__step-btn"
              aria-label="Moins de manches"
              :disabled="legsToWin <= MIN_LEGS"
              @click="legsToWin--"
            ><AppIcon name="minus" :width="24" :height="24" /></button>
            <span class="online-settings__step-value">{{ legsToWin }}</span>
            <button
              class="online-settings__step-btn online-settings__step-btn--up"
              aria-label="Plus de manches"
              :disabled="legsToWin >= MAX_LEGS"
              @click="legsToWin++"
            ><AppIcon name="plus" :width="24" :height="24" /></button>
          </div>
        </section>

        <p class="online-settings__note">
          <AppIcon name="globe" :width="18" :height="18" class="online-settings__note-icon" />
          {{ opponent ? profileName(opponent) : 'Ton ami' }} reçoit le défi sur son appareil.
          Une fois accepté, tu choisis qui commence : au bull ou au hasard.
        </p>

        <StartButton class="online-settings__start" tone="online" :disabled="!opponent || inviting" @click="challenge">
          {{ opponent ? `Défier ${profileName(opponent)}` : 'Choisis un adversaire' }}
        </StartButton>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.online-settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  @include safe-bottom($padding-md);

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-lg $padding-md 0;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;

    &--side { flex: 1; }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }

  &__add {
    @include title-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    height: 44px;
    border: $border-md dashed $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &:active { border-color: $mode-online; }
  }

  &__stepper {
    display: grid;
    grid-template-columns: 56px 1fr 56px;
    gap: $gap-xs;
  }

  &__step-btn {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &--up {
      border-color: $mode-online;
      background: $mode-online;
      color: $white;
    }

    &:disabled { opacity: 0.4; }
  }

  &__step-value {
    @include display-xs;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $surface;
    line-height: 1;
  }

  &__note {
    @include text-xs;
    display: flex;
    gap: $gap-xs;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
    color: $muted;
  }

  &__note-icon {
    flex-shrink: 0;
    color: $mode-online;
  }

  &__start { margin-top: auto; }
}

@media (min-width: $bp-laptop) {
  .online-settings {
    @include safe-bottom(0px);

    &__main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      padding: 0;
    }

    &__col {
      padding: $padding-xxl;
      gap: $gap-xxl;

      &--side { border-left: $border-sm solid $border-color; }
    }

    &__label { @include title-md; }
    &__hint { @include text-sm; }
    &__add { @include title-md; height: 56px; }
    &__stepper { grid-template-columns: 64px 1fr 64px; }
    &__step-btn { height: 64px; }
    &__step-value { @include display-sm; height: 64px; }
    &__note { @include text-sm; }
  }
}
</style>
