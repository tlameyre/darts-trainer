<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../store/authStore.js'
import { useFriendStore } from '../store/friendStore.js'
import AppHeader from '../components/AppHeader.vue'
import FriendCard from '../components/friends/FriendCard.vue'
import MyFriendCode from '../components/friends/MyFriendCode.vue'

const authStore  = useAuthStore()
const friendStore = useFriendStore()

const activeTab   = ref('friends')
const addInput    = ref('')
const addLoading  = ref(false)
const addFeedback = ref({ message: '', isError: false })

onMounted(() => friendStore.fetchFriends())

async function onAddFriend() {
  if (!addInput.value.trim()) return
  addLoading.value  = true
  addFeedback.value = { message: '', isError: false }

  const result = await friendStore.sendRequest(addInput.value)

  if (result.success) {
    addFeedback.value = { message: `Demande envoyée à ${result.name} !`, isError: false }
    addInput.value    = ''
  } else {
    addFeedback.value = { message: result.error, isError: true }
  }
  addLoading.value = false
}

const tabs = [
  { key: 'friends',  label: 'Amis' },
  { key: 'requests', label: 'Demandes' },
  { key: 'add',      label: 'Ajouter' },
]
</script>

<template>
  <div class="friends">
    <AppHeader title="AMIS" />

    <!-- Mon code ami -->
    <div class="friends__my-code" v-if="authStore.profile?.friend_code">
      <MyFriendCode :code="authStore.profile.friend_code" />
    </div>

    <!-- Onglets -->
    <div class="friends__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="friends__tab"
        :class="{ 'friends__tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="tab.key === 'requests' && friendStore.pendingReceived.length"
          class="friends__badge"
        >{{ friendStore.pendingReceived.length }}</span>
      </button>
    </div>

    <!-- Contenu -->
    <main class="friends__content">

      <!-- Onglet Amis -->
      <template v-if="activeTab === 'friends'">
        <div v-if="friendStore.loading" class="friends__empty">Chargement…</div>
        <div v-else-if="!friendStore.friends.length" class="friends__empty">
          Aucun ami pour l'instant.<br>Utilise l'onglet "Ajouter" pour en trouver.
        </div>
        <div v-else class="friends__list">
          <FriendCard
            v-for="f in friendStore.friends"
            :key="f.friendshipId"
            :friend="f"
            variant="friend"
            @remove="friendStore.removeFriendship"
          />
        </div>
      </template>

      <!-- Onglet Demandes -->
      <template v-else-if="activeTab === 'requests'">
        <template v-if="friendStore.pendingReceived.length">
          <p class="friends__section-title">Reçues</p>
          <div class="friends__list">
            <FriendCard
              v-for="f in friendStore.pendingReceived"
              :key="f.friendshipId"
              :friend="f"
              variant="received"
              @accept="friendStore.acceptRequest"
              @remove="friendStore.removeFriendship"
            />
          </div>
        </template>

        <template v-if="friendStore.pendingSent.length">
          <p class="friends__section-title">Envoyées</p>
          <div class="friends__list">
            <FriendCard
              v-for="f in friendStore.pendingSent"
              :key="f.friendshipId"
              :friend="f"
              variant="sent"
              @remove="friendStore.removeFriendship"
            />
          </div>
        </template>

        <div
          v-if="!friendStore.pendingReceived.length && !friendStore.pendingSent.length"
          class="friends__empty"
        >
          Aucune demande en cours.
        </div>
      </template>

      <!-- Onglet Ajouter -->
      <template v-else-if="activeTab === 'add'">
        <div class="friends__add">
          <p class="friends__add-hint">
            Entre le code ami de la personne que tu veux ajouter.
          </p>
          <div class="friends__add-row">
            <input
              v-model="addInput"
              class="friends__add-input"
              type="text"
              placeholder="Ex : DMC-A4X7"
              maxlength="12"
              autocomplete="off"
              autocapitalize="characters"
              @keyup.enter="onAddFriend"
            />
            <button
              class="friends__add-btn"
              :disabled="addLoading || !addInput.trim()"
              @click="onAddFriend"
            >
              <AppIcon v-if="!addLoading" name="user-plus" :width="18" :height="18" />
              <span v-else>…</span>
            </button>
          </div>
          <p
            v-if="addFeedback.message"
            class="friends__add-feedback"
            :class="{ 'friends__add-feedback--error': addFeedback.isError }"
          >
            {{ addFeedback.message }}
          </p>
        </div>
      </template>

    </main>
  </div>
</template>

<style lang="scss" scoped>
.friends {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding-bottom: calc(64px + env(safe-area-inset-bottom));

  &__my-code {
    padding: $padding-lg $padding-md $padding-md;
    display: flex;
    justify-content: center;
    border-bottom: $border-sm solid rgba(255, 255, 255, 0.07);
  }

  &__tabs {
    display: flex;
    border-bottom: $border-sm solid rgba(255, 255, 255, 0.07);
    padding: 0 $padding-md;
  }

  &__tab {
    @include title-sm;
    flex: 1;
    padding: $padding-sm 0;
    color: $muted;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;

    &--active {
      color: $orange;
      border-bottom-color: $orange;
    }

    &:active { opacity: 0.7; }
  }

  &__badge {
    @include text-xs;
    background: $orange;
    color: $white;
    border-radius: $radius-pill;
    padding: 1px 6px;
    min-width: 18px;
    text-align: center;
  }

  &__content {
    flex: 1;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-title {
    @include text-xs;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding-top: $padding-xs;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xxl $padding-md;
    line-height: 1.6;
  }

  &__add {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding-top: $padding-sm;
  }

  &__add-hint {
    @include text-sm;
    color: $muted;
  }

  &__add-row {
    display: flex;
    gap: $gap-sm;
  }

  &__add-input {
    @include title-md;
    flex: 1;
    background: rgba(255, 255, 255, 0.07);
    border: $border-sm solid rgba(255, 255, 255, 0.15);
    border-radius: $radius-md;
    color: $text-color;
    padding: $padding-sm $padding-md;
    outline: none;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: border-color 0.15s;

    &::placeholder { color: rgba(255, 255, 255, 0.2); text-transform: none; letter-spacing: 0; }
    &:focus { border-color: rgba(255, 255, 255, 0.4); }
  }

  &__add-btn {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    background: $orange;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:disabled { opacity: 0.4; }
    &:not(:disabled):active { opacity: 0.8; }
  }

  &__add-feedback {
    @include text-sm;
    color: $accent;

    &--error { color: $error; }
  }
}

@media (min-width: $bp-laptop) {
  .friends {
    max-width: 600px;
    margin: 0 auto;
    padding-top: $padding-xl;

    &__content { padding: $padding-lg; }
    &__add-input { @include title-lg; }
  }
}
</style>
