<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'
import DashedAddButton from '../settings/DashedAddButton.vue'
import { useFriendStore } from '../../store/friendStore.js'

const props = defineProps({
  show:    { type: Boolean, required: true },
  friends: { type: Array,   default: () => [] },
  // Already selected player ids to exclude (friends, searched accounts, guests)
  selectedIds: { type: Array, default: () => [] },
  // Nombre de joueurs qu'il est encore possible d'ajouter (limite du mode de jeu)
  maxAdditional: { type: Number, default: Infinity },
  // false = comptes uniquement (amis ou recherche), ex. tournois
  allowGuests: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'select'])

const friendStore = useFriendStore()

const selectedFriendIds = ref([])
const guestNames        = ref([])
const newGuestName      = ref('')
const showGuestInput    = ref(false)
const guestError        = ref('')

const searchQuery         = ref('')
const searchResults       = ref([])
const searchLoading       = ref(false)
// Objets complets (pas juste des ids) car searchResults est remplacé à chaque
// nouvelle recherche : il faut garder les utilisateurs choisis lors d'une
// recherche précédente même si la requête actuelle ne les renvoie plus.
const selectedSearchUsers    = ref([])
const friendRequestLoadingIds = ref([])
const sentFriendRequestIds    = ref([])
let   searchTimeout       = null

function toggleFriend(friend) {
  const idx = selectedFriendIds.value.indexOf(friend.id)
  if (idx === -1) {
    if (limitReached.value) return
    selectedFriendIds.value.push(friend.id)
  } else {
    selectedFriendIds.value.splice(idx, 1)
  }
}

function toggleSearchResult(user) {
  const idx = selectedSearchUsers.value.findIndex(u => u.id === user.id)
  if (idx === -1) {
    if (limitReached.value) return
    selectedSearchUsers.value.push(user)
  } else {
    selectedSearchUsers.value.splice(idx, 1)
  }
}

async function sendFriendRequest(user) {
  if (friendRequestLoadingIds.value.includes(user.id) || sentFriendRequestIds.value.includes(user.id)) return
  friendRequestLoadingIds.value.push(user.id)
  const result = await friendStore.sendRequest(user.friend_code)
  friendRequestLoadingIds.value = friendRequestLoadingIds.value.filter(id => id !== user.id)
  if (result.success) sentFriendRequestIds.value.push(user.id)
}

watch(searchQuery, (val) => {
  clearTimeout(searchTimeout)
  const q = val.trim()
  if (q.length < 2) {
    searchResults.value = []
    return
  }
  searchTimeout = setTimeout(async () => {
    searchLoading.value = true
    searchResults.value = await friendStore.searchUsers(q)
    searchLoading.value = false
  }, 400)
})

watch(newGuestName, () => { guestError.value = '' })

function addGuest() {
  const name = newGuestName.value.trim()
  if (!name) return
  if (limitReached.value) {
    guestError.value = 'Limite de joueurs atteinte.'
    return
  }
  if (guestNames.value.some(g => g.toLowerCase() === name.toLowerCase())) {
    guestError.value = 'Ce nom est déjà utilisé.'
    return
  }
  guestError.value     = ''
  guestNames.value.push(name)
  newGuestName.value   = ''
  showGuestInput.value = false
}

function removeGuest(i) {
  guestNames.value.splice(i, 1)
}

const availableFriends = computed(() =>
  props.friends.filter(f => !props.selectedIds.includes(f.id))
)

const friendIds = computed(() => props.friends.map(f => f.id))

const selectedSearchIds = computed(() => selectedSearchUsers.value.map(u => u.id))

const availableSearchResults = computed(() =>
  searchResults.value.filter(u =>
    !props.selectedIds.includes(u.id) && !friendIds.value.includes(u.id) && !selectedSearchIds.value.includes(u.id)
  )
)

function confirm() {
  const friends = availableFriends.value
    .filter(f => selectedFriendIds.value.includes(f.id))
    .map(f => ({ id: f.id, name: f.username || f.first_name || 'Ami', isFriend: true }))

  const searched = selectedSearchUsers.value
    .map(u => ({ id: u.id, name: u.username || u.first_name || 'Joueur', isRegistered: true }))

  const guests = guestNames.value.map((name, i) => ({
    id:      `guest-${Date.now()}-${i}`,
    name,
    isGuest: true,
  }))

  emit('select', [...friends, ...searched, ...guests])
  selectedFriendIds.value       = []
  selectedSearchUsers.value     = []
  friendRequestLoadingIds.value = []
  sentFriendRequestIds.value    = []
  searchQuery.value             = ''
  searchResults.value           = []
  guestNames.value              = []
  newGuestName.value            = ''
  showGuestInput.value          = false
  guestError.value              = ''
}

function handleClose() {
  selectedFriendIds.value       = []
  selectedSearchUsers.value     = []
  friendRequestLoadingIds.value = []
  sentFriendRequestIds.value    = []
  searchQuery.value             = ''
  searchResults.value           = []
  guestNames.value              = []
  newGuestName.value            = ''
  showGuestInput.value          = false
  guestError.value              = ''
  emit('close')
}

function avatarLetter(person) {
  return (person.first_name?.[0] || person.username?.[0] || '?').toUpperCase()
}

const hasSelection = computed(() =>
  selectedFriendIds.value.length > 0 || selectedSearchUsers.value.length > 0 || guestNames.value.length > 0
)

const selectionCount = computed(() =>
  selectedFriendIds.value.length + selectedSearchUsers.value.length + guestNames.value.length
)
const remainingSlots = computed(() => props.maxAdditional - selectionCount.value)
const limitReached   = computed(() => remainingSlots.value <= 0)

// Liste unifiée de tout ce qui est actuellement sélectionné, affichée en haut du picker
const selectedPlayers = computed(() => {
  const friends = availableFriends.value
    .filter(f => selectedFriendIds.value.includes(f.id))
    .map(f => ({ kind: 'friend', key: `friend-${f.id}`, name: f.username || f.first_name || 'Ami', letter: avatarLetter(f), raw: f }))

  const searched = selectedSearchUsers.value
    .map(u => ({ kind: 'search', key: `search-${u.id}`, name: u.username || u.first_name || 'Joueur', letter: avatarLetter(u), raw: u }))

  const guests = guestNames.value
    .map((name, i) => ({ kind: 'guest', key: `guest-${i}`, name, index: i }))

  return [...friends, ...searched, ...guests]
})

function removeSelected(item) {
  if (item.kind === 'friend') toggleFriend(item.raw)
  else if (item.kind === 'search') toggleSearchResult(item.raw)
  else if (item.kind === 'guest') removeGuest(item.index)
}
</script>

<template>
  <AppModal :show="show" title="Ajouter des joueurs" size="lg" centered @close="handleClose">
    <div class="picker">

      <!-- Everything selected so far, all kinds together -->
      <div v-if="selectedPlayers.length" class="picker__section">
        <div class="picker__label">Sélectionnés</div>
        <div class="picker__chips">
          <button
            v-for="item in selectedPlayers" :key="item.key"
            class="picker__chip"
            :aria-label="`Retirer ${item.name}`"
            @click="removeSelected(item)"
          >
            <span class="picker__chip-avatar">
              <AppIcon v-if="item.kind === 'guest'" name="user" :width="12" :height="12" />
              <template v-else>{{ item.letter }}</template>
            </span>
            {{ item.name }}
            <AppIcon name="close" :width="12" :height="12" />
          </button>
        </div>
      </div>

      <div v-if="availableFriends.length" class="picker__section">
        <div class="picker__label">Amis</div>
        <div class="picker__grid">
          <button
            v-for="friend in availableFriends"
            :key="friend.id"
            class="picker__row"
            :class="{ 'picker__row--selected': selectedFriendIds.includes(friend.id) }"
            :disabled="limitReached && !selectedFriendIds.includes(friend.id)"
            @click="toggleFriend(friend)"
          >
            <span class="picker__avatar">{{ avatarLetter(friend) }}</span>
            <span class="picker__name">{{ friend.username || friend.first_name }}</span>
            <span class="picker__check">
              <AppIcon name="check" :width="16" :height="16" />
            </span>
          </button>
        </div>
      </div>

      <p v-else-if="!friends.length" class="picker__status">
        Tu n'as pas encore d'amis. Ajoute-en depuis l'onglet Profil !
      </p>

      <div class="picker__section">
        <div class="picker__label">Rechercher un joueur</div>
        <input v-model="searchQuery" class="picker__input" placeholder="Pseudo…" />
        <p v-if="searchLoading" class="picker__status">Recherche…</p>
        <p v-else-if="searchQuery.trim().length >= 2 && !availableSearchResults.length" class="picker__status">
          Aucun joueur trouvé.
        </p>
        <div v-else-if="availableSearchResults.length" class="picker__grid">
          <div v-for="user in availableSearchResults" :key="user.id" class="picker__row">
            <button class="picker__row-select" :disabled="limitReached" @click="toggleSearchResult(user)">
              <span class="picker__avatar">{{ avatarLetter(user) }}</span>
              <span class="picker__name">{{ user.username || user.first_name }}</span>
            </button>
            <button
              class="picker__friend-btn"
              aria-label="Demander en ami"
              :disabled="friendRequestLoadingIds.includes(user.id) || sentFriendRequestIds.includes(user.id)"
              @click="sendFriendRequest(user)"
            >
              <AppIcon :name="sentFriendRequestIds.includes(user.id) ? 'check' : 'user-plus'" :width="16" :height="16" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="allowGuests" class="picker__section">
        <Transition name="slide-fade" mode="out-in">
          <div v-if="showGuestInput" class="picker__guest-row">
            <input
              v-model="newGuestName"
              class="picker__input"
              placeholder="Prénom ou pseudo"
              maxlength="20"
              @keyup.enter="addGuest"
            />
            <AppButton size="small" color="var(--picker-accent)" :block="false" @click="addGuest">OK</AppButton>
          </div>
          <DashedAddButton v-else :disabled="limitReached" @click="showGuestInput = true">Ajouter un invité</DashedAddButton>
        </Transition>
        <p v-if="guestError" class="picker__status picker__status--error">{{ guestError }}</p>
      </div>
      <p v-if="limitReached" class="picker__status">Limite de joueurs atteinte.</p>

      <AppButton size="cta" color="var(--picker-accent)" :disabled="!hasSelection" @click="confirm">
        Ajouter{{ hasSelection ? ` (${selectionCount})` : '' }}
      </AppButton>

    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.picker {
  --picker-accent: #{$accent};
  display: flex;
  flex-direction: column;
  gap: $gap-lg;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs;
  }

  &__chip {
    @include title-sm;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-xxs $padding-xs $padding-xxs $padding-xxs;
    border-radius: $radius-sm;
    background: var(--picker-accent);
    color: $white;
  }

  &__chip-avatar {
    @include title-xxs;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: rgba($white, 0.2);
  }

  &__grid {
    display: grid;
    gap: $gap-xs;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs $padding-sm $padding-xs $padding-xs;
    border: $border-md solid $surface;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;
    text-align: left;

    &:disabled { opacity: 0.4; }

    &--selected { border-color: var(--picker-accent); }
  }

  &__row-select {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: $gap-sm;
    color: inherit;
    text-align: left;

    &:disabled { opacity: 0.4; }
  }

  &__avatar {
    @include title-sm;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $blue;
    color: $white;
  }

  &__name {
    @include title-lg;
    flex: 1;
    min-width: 0;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__check {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $muted;
    border-radius: $radius-sm;
    color: transparent;
  }

  &__row--selected &__check {
    border-color: var(--picker-accent);
    background: var(--picker-accent);
    color: $white;
  }

  &__friend-btn {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $bg;
    color: $text-color;

    &:disabled { color: var(--picker-accent); }
  }

  &__input {
    @include text-md;
    min-width: 0;
    height: 44px;
    padding: 0 $padding-sm;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $white;
    color: $text-color;

    &::placeholder { color: $input-placeholder; }

    &:focus {
      outline: none;
      border-color: var(--picker-accent);
    }
  }

  &__guest-row {
    display: flex;
    gap: $gap-xs;

    // Only here: in the column sections flex: 1 would collapse the input's height
    .picker__input { flex: 1; }
  }

  &__status {
    @include text-sm;
    color: $muted;

    &--error { color: $error; }
  }
}

@media (min-width: $bp-laptop) {
  .picker {
    &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    &__label { @include title-md; }
    &__name { @include title-xl; line-height: 1; }
    &__status { @include text-md; }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
