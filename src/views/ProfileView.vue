<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { user, profile, signOut, updateProfile } from '../store/authStore.js'
import { fetchProfileStats } from '../store/dbStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import ProfileEditModal from '../components/profile/ProfileEditModal.vue'

const router = useRouter()

const stats       = ref(null)
const showEdit    = ref(false)
const saveLoading = ref(false)

onMounted(async () => {
  stats.value = await fetchProfileStats()
})

// Nom affiché : "Prénom Nom" si dispo, sinon surnom, sinon email
const displayName = computed(() => {
  const p = profile.value
  if (!p) return '—'
  const full = [p.first_name, p.last_name].filter(Boolean).join(' ')
  return full || p.username || user.value?.email || '—'
})

// Initiales pour l'avatar
const initials = computed(() => {
  const p = profile.value
  if (!p) return '?'
  if (p.first_name || p.last_name) {
    return [(p.first_name?.[0] ?? ''), (p.last_name?.[0] ?? '')].join('').toUpperCase()
  }
  return (p.username?.[0] ?? user.value?.email?.[0] ?? '?').toUpperCase()
})

async function onSave(fields) {
  saveLoading.value = true
  try {
    await updateProfile(fields)
    showEdit.value = false
  } finally {
    saveLoading.value = false
  }
}

async function onSignOut() {
  await signOut()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="profile">
    <AppHeader title="PROFIL" @back="router.push({ name: 'home' })">
      <template #right>
        <button class="profile__edit-btn" @click="showEdit = true">
          <AppIcon name="pen" :width="18" :height="18" />
        </button>
      </template>
    </AppHeader>

    <main class="profile__main">

      <!-- Avatar + identité -->
      <section class="profile__hero">
        <div class="profile__avatar">
          <span class="profile__avatar-initials">{{ initials }}</span>
        </div>
        <h1 class="profile__name">{{ displayName }}</h1>
        <p v-if="profile?.username" class="profile__username">{{ profile.username }}</p>
      </section>

      <!-- Stats -->
      <section class="profile__stats-card">
        <div class="profile__stat">
          <span class="profile__stat-value">{{ stats?.totalSessions ?? '—' }}</span>
          <span class="profile__stat-label">Parties jouées</span>
        </div>
        <div class="profile__stat-divider" />
        <div class="profile__stat">
          <span class="profile__stat-value">{{ stats?.totalDarts ?? '—' }}</span>
          <span class="profile__stat-label">Fléchettes</span>
        </div>
        <div class="profile__stat-divider" />
        <div class="profile__stat">
          <span class="profile__stat-value">
            {{ stats?.avgAccuracy != null ? stats.avgAccuracy + '%' : '—' }}
          </span>
          <span class="profile__stat-label">Précision</span>
        </div>
      </section>

      <AppButton variant="ghost" class="profile__logout" @click="onSignOut">
        Se déconnecter
      </AppButton>

    </main>

    <ProfileEditModal
      :show="showEdit"
      :first-name="profile?.first_name ?? ''"
      :last-name="profile?.last_name ?? ''"
      :username="profile?.username ?? ''"
      @close="showEdit = false"
      @save="onSave"
    />
  </div>
</template>

<style lang="scss" scoped>
.profile {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-md;
  gap: $gap-md;

  &__edit-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    padding: $padding-xxs;
    transition: opacity 0.15s;
    &:active { opacity: 0.6; }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding-bottom: $padding-xxl;
  }

  // --- Hero ---
  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xl 0 $padding-md;
  }

  &__avatar {
    width: 88px;
    height: 88px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $gap-xs;
  }

  &__avatar-initials {
    @include title-xl;
    font-size: 32px;
    color: $white;
    line-height: 1;
  }

  &__name {
    @include title-xl;
    color: $text-color;
    text-align: center;
  }

  &__username {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  // --- Stats ---
  &__stats-card {
    display: flex;
    align-items: stretch;
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-lg;
    padding: $padding-lg $padding-md;
  }

  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__stat-divider {
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 $gap-xs;
  }

  &__stat-value {
    @include title-xl;
    color: $text-color;
    font-size: $title-xxl;
  }

  &__stat-label {
    font-family: $font-text;
    font-size: 11px;
    color: $muted;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  // --- Logout ---
  &__logout {
    color: $error;
    border-color: rgba($error, 0.3);
  }
}
</style>
