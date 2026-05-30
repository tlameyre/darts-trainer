<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { user, profile, signOut } from '../store/authStore.js'
import { fetchProfileStats } from '../store/dbStore.js'
import { fetchUserBadges } from '../store/badgeStore.js'
import { BADGES } from '../data/badges.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()
const stats        = ref(null)
const userBadges   = ref([])

onMounted(async () => {
  const [s, b] = await Promise.all([fetchProfileStats(), fetchUserBadges()])
  stats.value      = s
  userBadges.value = b
})

function isUnlocked(badgeId) {
  return userBadges.value.some(b => b.id === badgeId)
}

function unlockedAt(badgeId) {
  const b = userBadges.value.find(b => b.id === badgeId)
  if (!b) return null
  return new Date(b.unlockedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const displayName = computed(() => {
  const p = profile.value
  if (!p) return '—'
  const full = [p.first_name, p.last_name].filter(Boolean).join(' ')
  return full || p.username || user.value?.email || '—'
})

const initials = computed(() => {
  const p = profile.value
  if (!p) return '?'
  if (p.first_name || p.last_name) {
    return [(p.first_name?.[0] ?? ''), (p.last_name?.[0] ?? '')].join('').toUpperCase()
  }
  return (p.username?.[0] ?? user.value?.email?.[0] ?? '?').toUpperCase()
})

async function onSignOut() {
  await signOut()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="profile">
    <AppHeader title="PROFIL" @back="router.push({ name: 'home' })">
      <template #right>
        <button class="profile__edit-btn" @click="router.push({ name: 'profile-edit' })">
          <AppIcon name="pen" :width="18" :height="18" />
        </button>
      </template>
    </AppHeader>

    <main class="profile__main">

      <section class="profile__hero">
        <div class="profile__avatar">
          <span class="profile__avatar-initials">{{ initials }}</span>
        </div>
        <h1 class="profile__name">{{ displayName }}</h1>
        <p v-if="profile?.username" class="profile__username">{{ profile.username }}</p>
      </section>

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

      <!-- Badges -->
      <section class="profile__badges">
        <h2 class="profile__badges-title">Badges <span>{{ userBadges.length }}/{{ BADGES.length }}</span></h2>
        <div class="profile__badges-grid">
          <div
            v-for="badge in BADGES"
            :key="badge.id"
            class="profile__badge"
            :class="{ 'profile__badge--locked': !isUnlocked(badge.id) }"
          >
            <span class="profile__badge-icon">{{ badge.icon }}</span>
            <span class="profile__badge-label">{{ badge.label }}</span>
            <span v-if="isUnlocked(badge.id)" class="profile__badge-date">{{ unlockedAt(badge.id) }}</span>
            <span v-else class="profile__badge-locked">Verrouillé</span>
          </div>
        </div>
      </section>

      <AppButton variant="ghost" class="profile__logout" @click="onSignOut">
        Se déconnecter
      </AppButton>

    </main>
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

  // --- Badges ---
  &__badges {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__badges-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    span {
      color: $orange;
      margin-left: $gap-xs;
    }
  }

  &__badges-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $gap-sm;
  }

  &__badge {
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: opacity 0.2s;

    &--locked {
      opacity: 0.35;
    }
  }

  &__badge-icon {
    font-size: 28px;
    line-height: 1;
    margin-bottom: $gap-xxs;
  }

  &__badge-label {
    @include title-sm;
    color: $text-color;
  }

  &__badge-date {
    font-size: 11px;
    color: $accent;
  }

  &__badge-locked {
    font-size: 11px;
    color: $muted;
  }

  // --- Logout ---
  &__logout {
    color: $error;
    border-color: rgba($error, 0.3);
  }
}
</style>
