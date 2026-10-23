<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '../store/friendStore.js'
import { useOnlineMatchStore, profileName } from '../store/onlineMatchStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'

const props = defineProps({
  // Preview /dev uniquement : liste d'amis fictive
  mockFriends: { type: Array, default: null },
})

const router           = useRouter()
const friendStore      = useFriendStore()
const onlineMatchStore = useOnlineMatchStore()

const SCORE_OPTIONS = [101, 301, 501]
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
    <AppHeader title="501 en ligne" @back="router.push({ name: 'play' })" />

    <main class="online-settings__main">
      <div class="online-settings__card">
        <div class="online-settings__section-label">Adversaire</div>
        <p class="online-settings__hint">Ton ami reçoit le défi et joue depuis son propre appareil.</p>

        <div v-if="friends.length" class="online-settings__friends">
          <button
            v-for="f in friends" :key="f.id"
            class="online-settings__friend"
            :class="{ 'online-settings__friend--selected': f.id === opponentId }"
            @click="selectFriend(f)"
          >
            <span class="online-settings__avatar">{{ profileName(f).charAt(0).toUpperCase() }}</span>
            <span class="online-settings__friend-name">{{ profileName(f) }}</span>
            <span v-if="openMatchWith(f.id)" class="online-settings__friend-status">
              {{ STATUS_LABELS[openMatchWith(f.id).status] }}
            </span>
            <AppIcon v-else-if="f.id === opponentId" name="check" :width="18" :height="18" class="online-settings__check" />
          </button>
        </div>
        <button v-else class="online-settings__empty" @click="router.push({ name: 'friends' })">
          Ajoute un ami pour le défier en ligne →
        </button>
      </div>

      <div class="online-settings__card">
        <div class="online-settings__section-label">Score de départ</div>
        <div class="online-settings__row">
          <AppButton
            v-for="s in SCORE_OPTIONS" :key="s"
            size="small" variant="ghost" :active="startScore === s"
            @click="startScore = s"
          >{{ s }}</AppButton>
        </div>
      </div>

      <div class="online-settings__card">
        <div class="online-settings__section-label">Manches à gagner</div>
        <div class="online-settings__stepper">
          <button
            class="online-settings__stepper-btn"
            :disabled="legsToWin <= MIN_LEGS"
            @click="legsToWin--"
          >−</button>
          <span class="online-settings__stepper-value">{{ legsToWin }}</span>
          <button
            class="online-settings__stepper-btn"
            :disabled="legsToWin >= MAX_LEGS"
            @click="legsToWin++"
          >+</button>
        </div>
        <p class="online-settings__hint">
          Le premier à {{ legsToWin }} manche{{ legsToWin > 1 ? 's' : '' }} gagne.
          Une fois le défi accepté, tu choisiras qui commence : au bull ou au hasard.
        </p>
      </div>
    </main>

    <AppButton :disabled="!opponent || inviting" @click="challenge">
      {{ opponent ? `DÉFIER ${profileName(opponent).toUpperCase()}` : 'CHOISIS UN ADVERSAIRE' }}
    </AppButton>
  </div>
</template>

<style lang="scss" scoped>
.online-settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: 0 auto;
  padding: $padding-lg $padding-md 0;
  gap: $gap-xl;
  @include nav-safe-bottom;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__section-label {
    @include title-lg;
    color: $white;
  }

  &__hint {
    @include title-sm;
    color: $muted;
  }

  &__friends {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__friend {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    background: rgba($white, 0.05);
    border: $border-sm solid transparent;
    border-radius: $radius-sm;
    color: $text-color;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;

    &:active { background: rgba($white, 0.08); }

    &--selected {
      border-color: $orange;
      background: rgba($orange, 0.1);
    }
  }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    background: $orange;
    color: $white;
    @include title-sm;
  }

  &__friend-name {
    flex: 1;
    @include text-sm;
  }

  &__friend-status {
    @include text-xs;
    color: $accent;
  }

  &__check { color: $orange; }

  &__empty {
    @include text-sm;
    color: $muted;
    padding: $padding-sm $padding-md;
    border-radius: $radius-sm;
    border: $border-sm dashed rgba($white, 0.2);
    text-align: center;

    &:active { color: $orange; }
  }

  &__row {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) { flex: 1; }
  }

  &__stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-lg;
  }

  &__stepper-btn {
    width: 44px;
    height: 44px;
    border-radius: $radius-pill;
    border: $border-md solid rgba($white, 0.15);
    background: rgba($white, 0.05);
    color: $text-color;
    @include title-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, color 0.15s, opacity 0.15s;

    &:active:not(:disabled) {
      border-color: $orange;
      color: $orange;
    }

    &:disabled { opacity: 0.3; }
  }

  &__stepper-value {
    @include display-sm;
    color: $white;
    min-width: 48px;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .online-settings {
    padding: $padding-xxl $padding-xxl 0;
    @include nav-safe-bottom($padding-xl);

    &__section-label { @include title-xl; }
    &__hint          { @include title-md; }
    &__friend-name,
    &__empty         { @include text-md; }
    &__friend-status { @include text-sm; }
    &__avatar        { @include title-md; }
    &__stepper-btn   { @include title-xl; }
    &__stepper-value { @include display-md; }
  }
}
</style>
