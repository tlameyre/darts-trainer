<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../store/authStore.js'
import { useFriendStore } from '../store/friendStore.js'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import AppTabs from '../components/AppTabs.vue'
import FriendCard from '../components/friends/FriendCard.vue'
import MyFriendCode from '../components/friends/MyFriendCode.vue'
import UserSearchResult from '../components/friends/UserSearchResult.vue'
import SectionTitle from '../components/SectionTitle.vue'

// Props mock optionnelles — utilisées uniquement dans /dev pour prévisualiser sans auth
const props = defineProps({
  mockFriends:    { type: Array,  default: null },
  mockReceived:   { type: Array,  default: null },
  mockSent:       { type: Array,  default: null },
  mockFriendCode: { type: String, default: null },
})

const isMock = computed(() => props.mockFriends !== null)

const authStore   = useAuthStore()
const router = useRouter()
const friendStore = useFriendStore()

const activeTab   = ref('friends')
const addInput    = ref('')
const addLoading  = ref(false)
const addFeedback = ref({ message: '', isError: false })

// Search state
const searchResults  = ref([])
const searchLoading  = ref(false)
const sentUserIds    = ref(new Set())
let   searchTimeout   = null
let   feedbackTimeout = null

function setFeedback(message, isError = false) {
  clearTimeout(feedbackTimeout)
  addFeedback.value = { message, isError }
  if (message) feedbackTimeout = setTimeout(() => { addFeedback.value = { message: '', isError: false } }, 3000)
}

const isDmcCode = computed(() => /^DMC-/i.test(addInput.value.trim()))

onMounted(() => { if (!isMock.value) friendStore.fetchFriends() })

const friends         = computed(() => isMock.value ? props.mockFriends         : friendStore.friends)
const pendingReceived = computed(() => isMock.value ? props.mockReceived         : friendStore.pendingReceived)
const pendingSent     = computed(() => isMock.value ? props.mockSent             : friendStore.pendingSent)
const friendCode      = computed(() => isMock.value ? props.mockFriendCode       : authStore.profile?.friend_code)
const isLoading       = computed(() => isMock.value ? false                      : friendStore.loading)

watch(addInput, (val) => {
  clearTimeout(searchTimeout)

  const q = val.trim()
  if (q) setFeedback('')

  if (!q || isDmcCode.value || isMock.value) {
    searchResults.value = []
    return
  }
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

async function onAddFriend() {
  if (!addInput.value.trim()) return
  if (isMock.value) {
    setFeedback('Demande envoyée à Pro180 !')
    addInput.value = ''
    return
  }
  addLoading.value = true
  setFeedback('')
  const result = await friendStore.sendRequest(addInput.value)
  if (result.success) {
    setFeedback(`Demande envoyée à ${result.name} !`)
    addInput.value       = ''
    searchResults.value  = []
  } else {
    setFeedback(result.error, true)
  }
  addLoading.value = false
}

async function onAddFromSearch(user) {
  sentUserIds.value.add(user.id)
  const result = await friendStore.sendRequest(user.friend_code)
  if (result.success) {
    setFeedback(`Demande envoyée à ${result.name} !`)
    addInput.value       = ''
    searchResults.value  = []
  } else {
    sentUserIds.value.delete(user.id)
    setFeedback(result.error, true)
  }
}

const tabs = [
  { id: 'friends',  label: 'Amis',     icon: 'user' },
  { id: 'requests', label: 'Demandes', icon: 'mail' },
  { id: 'add',      label: 'Ajouter',  icon: 'user-plus' },
]
</script>

<template>
  <div class="friends">
    <AppHeader title="AMIS" tone="ink" @back="router.back()" />

    <MyFriendCode v-if="friendCode" :code="friendCode" />

    <AppTabs class="friends__tabs" variant="underline" :tabs="tabs" v-model="activeTab">
      <template #friends>Amis <span class="friends__count">{{ friends.length }}</span></template>
      <template #requests>
        Demandes
        <span v-if="pendingReceived.length" class="friends__badge">{{ pendingReceived.length }}</span>
      </template>
    </AppTabs>

    <div class="friends__body">
      <!-- Desktop: tabs become a side menu -->
      <nav class="friends__side" aria-label="Onglets amis">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="friends__side-item"
          :class="{ 'friends__side-item--active': activeTab === tab.id }"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          @click="activeTab = tab.id"
        >
          <AppIcon :name="tab.icon" :width="20" :height="20" />
          <span class="friends__side-label">{{ tab.label }}</span>
          <span v-if="tab.id === 'friends'" class="friends__side-count">{{ friends.length }}</span>
          <span v-else-if="tab.id === 'requests' && pendingReceived.length" class="friends__badge">{{ pendingReceived.length }}</span>
        </button>
        <p class="friends__side-hint">Partage ton code pour qu'on t'ajoute, ou cherche un joueur dans « Ajouter ».</p>
      </nav>

      <main class="friends__content">

        <!-- Onglet Amis -->
        <template v-if="activeTab === 'friends'">
          <SectionTitle class="friends__heading" title="Mes amis" :count="String(friends.length)" ruled />
          <p v-if="isLoading" class="friends__empty">Chargement…</p>
          <p v-else-if="!friends.length" class="friends__empty">
            Aucun ami pour l'instant. Utilise l'onglet « Ajouter » pour en trouver.
          </p>
          <template v-else>
            <div class="friends__list">
              <FriendCard
                v-for="f in friends"
                :key="f.friendshipId"
                :friend="f"
                variant="friend"
                @remove="friendStore.removeFriendship"
              />
            </div>
            <p class="friends__hint">Partage ton code pour qu'on t'ajoute, ou va dans « Ajouter » pour chercher un joueur.</p>
          </template>
        </template>

        <!-- Onglet Demandes -->
        <template v-else-if="activeTab === 'requests'">
          <section class="friends__section">
            <SectionTitle title="Reçues" :count="String(pendingReceived.length)" ruled />
            <div v-if="pendingReceived.length" class="friends__list">
              <FriendCard
                v-for="f in pendingReceived"
                :key="f.friendshipId"
                :friend="f"
                variant="received"
                @accept="friendStore.acceptRequest"
                @remove="friendStore.removeFriendship"
              />
            </div>
            <p v-else class="friends__empty">Aucune demande reçue pour l'instant.</p>
          </section>

          <section class="friends__section">
            <SectionTitle title="Envoyées" :count="String(pendingSent.length)" ruled />
            <div v-if="pendingSent.length" class="friends__list">
              <FriendCard
                v-for="f in pendingSent"
                :key="f.friendshipId"
                :friend="f"
                variant="sent"
                @remove="friendStore.removeFriendship"
              />
            </div>
            <p v-else class="friends__empty">Aucune demande envoyée.</p>
          </section>
        </template>

        <!-- Onglet Ajouter -->
        <template v-else-if="activeTab === 'add'">
          <div class="friends__add-row">
            <label class="friends__add-field">
              <span class="friends__add-label">Prénom, pseudo ou code ami (DMC-XXXX)</span>
              <span class="friends__add-wrap">
                <AppIcon name="search" :width="20" :height="20" class="friends__add-icon" />
                <input
                  v-model="addInput"
                  class="friends__add-input"
                  :class="{ 'friends__add-input--code': isDmcCode }"
                  type="search"
                  autocomplete="off"
                  :autocapitalize="isDmcCode ? 'characters' : 'none'"
                  @keyup.enter="isDmcCode ? onAddFriend() : null"
                />
              </span>
            </label>
            <button
              v-if="isDmcCode"
              class="friends__add-btn"
              :disabled="addLoading || !addInput.trim()"
              aria-label="Envoyer la demande"
              @click="onAddFriend"
            >
              <AppIcon v-if="!addLoading" name="user-plus" :width="18" :height="18" />
              <span v-else>…</span>
            </button>
          </div>

          <!-- Résultats de recherche -->
          <p v-if="searchLoading" class="friends__empty">Recherche…</p>
          <p
            v-else-if="!isDmcCode && addInput.trim().length >= 2 && searchResults.length === 0"
            class="friends__empty"
          >
            Aucun résultat pour « {{ addInput.trim() }} »
          </p>
          <section v-else-if="searchResults.length" class="friends__section">
            <SectionTitle
              title="Résultats"
              :count="`${searchResults.length} joueur${searchResults.length > 1 ? 's' : ''}`"
              ruled
            />
            <div class="friends__list">
              <UserSearchResult
                v-for="u in searchResults"
                :key="u.id"
                :user="u"
                :sent="sentUserIds.has(u.id)"
                @add="onAddFromSearch"
              />
            </div>
          </section>

          <p
            v-if="addFeedback.message"
            class="friends__add-feedback"
            :class="{ 'friends__add-feedback--error': addFeedback.isError }"
          >
            {{ addFeedback.message }}
          </p>
        </template>

      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.friends {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__count { color: $error; }

  &__badge {
    @include text-xs;
    min-width: 18px;
    padding: 1px 6px;
    border-radius: $radius-pill;
    background: $error;
    color: $white;
    line-height: 1.4;
    text-align: center;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__side { display: none; }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-md $padding-md 0;
    @include nav-safe-bottom;
  }

  &__heading { display: none; }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__list {
    border-radius: $radius-sm;
    background: $surface;
    overflow: hidden;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }

  &__empty {
    @include text-sm;
    padding: $padding-sm;
    border: $border-md dashed $border-color;
    border-radius: $radius-sm;
    color: $muted;
    text-align: center;
  }

  &__add-row {
    display: flex;
    align-items: flex-end;
    gap: $gap-sm;
  }

  &__add-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__add-label {
    @include text-xs;
    font-weight: 600;
    color: $muted;
  }

  &__add-wrap {
    position: relative;
    display: block;
  }

  &__add-icon {
    position: absolute;
    left: $padding-sm;
    top: 14px;
    color: $muted;
  }

  &__add-input {
    @include text-md;
    width: 100%;
    height: 48px;
    padding: 0 $padding-sm 0 42px;
    background: $white;
    border: $border-md solid $black;
    border-radius: $radius-sm;
    color: $text-color;
    outline: none;

    &--code {
      text-transform: uppercase;
      letter-spacing: $tracking-sm;
    }
  }

  &__add-btn {
    width: 48px;
    height: 48px;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
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
    &__tabs { display: none; }

    &__body {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      align-items: start;
      gap: $gap-xxl;
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding-top: $padding-xxl;
    }

    &__side {
      display: flex;
      flex-direction: column;
      gap: $gap-xs;
    }

    &__side-item {
      display: flex;
      align-items: center;
      gap: $gap-sm;
      height: 52px;
      padding: 0 14px;
      border: $border-md solid $border-color;
      border-radius: $radius-sm;
      color: $text-color;
      transition: background 0.15s;

      &--active {
        background: $black;
        border-color: $black;
        color: $bg;
      }

      &:hover:not(.friends__side-item--active) { background: $surface; }
    }

    &__side-label {
      @include title-lg;
      flex: 1;
      text-align: left;
      text-transform: uppercase;
    }

    &__side-count { @include text-sm; }

    &__side-hint {
      @include text-sm;
      margin-top: $gap-xs;
      line-height: 1.4;
      color: $muted;
    }

    &__content { padding: 0; gap: $gap-lg; @include nav-safe-bottom($padding-xl); }

    &__heading { display: flex; }
    &__hint { display: none; }
    &__empty { @include text-md; }
    &__add-label { @include text-sm; }
    &__add-input { @include text-lg; height: 56px; padding-left: 48px; }
    &__add-icon { top: 17px; }
    &__add-btn { height: 56px; width: 56px; }
    &__add-feedback { @include text-md; }
  }
}
</style>
