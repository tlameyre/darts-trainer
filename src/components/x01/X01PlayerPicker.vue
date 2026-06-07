<script setup>
import { ref, computed } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  show:    { type: Boolean, required: true },
  friends: { type: Array,   default: () => [] },
  // Already selected friend ids to exclude
  selectedIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'select'])

const selectedFriendIds = ref([])
const guestNames        = ref([])
const newGuestName      = ref('')
const showGuestInput    = ref(false)

function toggleFriend(friend) {
  const idx = selectedFriendIds.value.indexOf(friend.id)
  if (idx === -1) selectedFriendIds.value.push(friend.id)
  else selectedFriendIds.value.splice(idx, 1)
}

function addGuest() {
  const name = newGuestName.value.trim()
  if (!name) return
  guestNames.value.push(name)
  newGuestName.value  = ''
  showGuestInput.value = false
}

function removeGuest(i) {
  guestNames.value.splice(i, 1)
}

const availableFriends = computed(() =>
  props.friends.filter(f => !props.selectedIds.includes(f.id))
)

function confirm() {
  const friends = availableFriends.value
    .filter(f => selectedFriendIds.value.includes(f.id))
    .map(f => ({ id: f.id, name: f.username || f.first_name || 'Ami', isFriend: true }))

  const guests = guestNames.value.map((name, i) => ({
    id:      `guest-${Date.now()}-${i}`,
    name,
    isGuest: true,
  }))

  emit('select', [...friends, ...guests])
  selectedFriendIds.value = []
  guestNames.value        = []
  newGuestName.value      = ''
  showGuestInput.value    = false
}

function handleClose() {
  selectedFriendIds.value = []
  guestNames.value        = []
  newGuestName.value      = ''
  showGuestInput.value    = false
  emit('close')
}

function avatarLetter(friend) {
  return (friend.first_name?.[0] || friend.username?.[0] || '?').toUpperCase()
}

const hasSelection = computed(() =>
  selectedFriendIds.value.length > 0 || guestNames.value.length > 0
)
</script>

<template>
  <AppModal :show="show" title="Ajouter des joueurs" size="lg" @close="handleClose">
    <div class="picker">

      <!-- Amis -->
      <div v-if="availableFriends.length" class="picker__section">
        <div class="picker__section-label">Amis</div>
        <div class="picker__list">
          <button
            v-for="friend in availableFriends"
            :key="friend.id"
            class="picker__item"
            :class="{ 'picker__item--selected': selectedFriendIds.includes(friend.id) }"
            @click="toggleFriend(friend)"
          >
            <div class="picker__avatar">{{ avatarLetter(friend) }}</div>
            <div class="picker__info">
              <span class="picker__name">{{ friend.username || friend.first_name }}</span>
              <span class="picker__code">{{ friend.friend_code }}</span>
            </div>
            <div class="picker__check">
              <AppIcon v-if="selectedFriendIds.includes(friend.id)" name="check" :width="16" :height="16" />
            </div>
          </button>
        </div>
      </div>

      <div v-else-if="!friends.length" class="picker__empty">
        Tu n'as pas encore d'amis.<br>Ajoute-en depuis l'onglet Profil !
      </div>

      <!-- Invités déjà ajoutés -->
      <div v-if="guestNames.length" class="picker__section">
        <div class="picker__section-label">Invités</div>
        <div class="picker__list">
          <div v-for="(name, i) in guestNames" :key="i" class="picker__item picker__item--guest">
            <div class="picker__avatar picker__avatar--guest">{{ name[0]?.toUpperCase() }}</div>
            <span class="picker__name">{{ name }}</span>
            <button class="picker__remove" @click="removeGuest(i)">
              <AppIcon name="close" :width="14" :height="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Ajouter invité -->
      <div class="picker__guest-add">
        <Transition name="slide-fade">
          <div v-if="showGuestInput" class="picker__guest-input-row">
            <input
              v-model="newGuestName"
              class="picker__guest-input"
              placeholder="Prénom ou pseudo"
              maxlength="20"
              @keyup.enter="addGuest"
            />
            <AppButton size="small" @click="addGuest">OK</AppButton>
          </div>
        </Transition>
        <button v-if="!showGuestInput" class="picker__add-guest-btn" @click="showGuestInput = true">
          + Ajouter un invité
        </button>
      </div>

      <!-- Confirmer -->
      <AppButton :disabled="!hasSelection" @click="confirm">
        Ajouter {{ hasSelection ? `(${selectedFriendIds.length + guestNames.length})` : '' }}
      </AppButton>

    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;
  padding: $padding-md;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-label {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    background: rgba($white, 0.05);
    border: $border-sm solid transparent;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    text-align: left;
    width: 100%;

    &--selected {
      background: rgba($orange, 0.15);
      border-color: $orange;
    }

    &--guest {
      cursor: default;
    }
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-sm;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;

    &--guest {
      background: rgba($white, 0.15);
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    @include title-sm;
    color: $text-color;
    font-weight: 600;
  }

  &__code {
    @include text-xs;
    color: $muted;
  }

  &__check {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $orange;
    flex-shrink: 0;
  }

  &__remove {
    color: $muted;
    display: flex;
    align-items: center;
    padding: $padding-xs;

    &:active { opacity: 0.6; }
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-lg 0;
    line-height: 1.6;
  }

  &__guest-add {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__guest-input-row {
    display: flex;
    gap: $gap-sm;
    align-items: center;
  }

  &__guest-input {
    flex: 1;
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    @include text-md;
    padding: $padding-xs $padding-sm;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__add-guest-btn {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include text-sm;
    color: $muted;
    padding: $padding-xs 0;

    &:active { opacity: 0.7; }
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
