<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { profile, user } from '../store/authStore.js'
import { fetchUserBadges } from '../store/badgeStore.js'
import { GAME_MODES } from '../data/gameModes.js'
import { BADGES } from '../data/badges.js'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()
const userBadges = ref([])

onMounted(async () => {
  userBadges.value = await fetchUserBadges()
})

const displayName = computed(() => {
  const p = profile.value
  if (!p) return 'Joueur'
  return p.first_name || p.username || 'Joueur'
})

const initials = computed(() => {
  const p = profile.value
  if (!p) return '?'
  if (p.first_name || p.last_name) {
    return [(p.first_name?.[0] ?? ''), (p.last_name?.[0] ?? '')].join('').toUpperCase()
  }
  return (p.username?.[0] ?? user.value?.email?.[0] ?? '?').toUpperCase()
})

// 4 derniers badges débloqués
const recentBadges = computed(() => userBadges.value.slice(0, 4))
</script>

<template>
  <div class="home">
    <header class="home__header">
      <button class="home__avatar" @click="router.push({ name: 'profile' })">
        {{ initials }}
      </button>
      <div>
        <p class="home__greeting">Bonjour,</p>
        <h1 class="home__name">{{ displayName }}</h1>
      </div>
    </header>

    <main class="home__main">

      <!-- Raccourcis modes de jeu -->
      <section class="home__section">
        <h2 class="home__section-title">Jouer</h2>
        <div class="home__modes">
          <button v-for="mode in GAME_MODES" :key="mode.id" class="home__mode-card"
            :style="{ '--mode-color': mode.color }" @click="router.push({ name: mode.settingsRoute })">
            <AppIcon name="dartboard" :width="22" :height="22" class="home__mode-icon" />
            <span class="home__mode-label">{{ mode.title.replace('\n', ' ') }}</span>
            <AppIcon name="arrow-left" :width="14" :height="14" class="home__mode-arrow" />
          </button>
        </div>
      </section>

      <!-- Badges récents -->
      <section class="home__section">
        <div class="home__section-header">
          <h2 class="home__section-title">
            Badges <span class="home__section-count">{{ userBadges.length }}/{{ BADGES.length }}</span>
          </h2>
          <button class="home__section-link" @click="router.push({ name: 'badges' })">
            Voir tout
          </button>
        </div>

        <div v-if="recentBadges.length" class="home__badges">
          <button v-for="badge in recentBadges" :key="badge.id" class="home__badge"
            @click="router.push({ name: 'badges' })">
            <span class="home__badge-icon">{{ badge.icon }}</span>
            <span class="home__badge-label">{{ badge.label }}</span>
          </button>
        </div>

        <button v-else class="home__badges-empty" @click="router.push({ name: 'badges' })">
          <span>Aucun badge encore — commence à jouer !</span>
          <AppIcon name="arrow-left" :width="14" :height="14" class="home__mode-arrow" />
        </button>
      </section>

    </main>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $padding-xl;

  &__header {
    padding-top: $padding-lg;
    display: flex;
    align-items: center;
    gap: $gap-md;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: $radius-pill;
    background: $orange;
    color: $white;
    font-family: $font-title;
    font-weight: 700;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:active {
      opacity: 0.7;
    }
  }

  &__greeting {
    @include text-sm;
    color: $muted;
  }

  &__name {
    @include title-xl;
    font-size: 28px;
    line-height: 1;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
  }

  // --- Section ---
  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__section-count {
    color: $orange;
    margin-left: $gap-xs;
  }

  &__section-link {
    @include text-sm;
    color: $orange;
    font-size: 13px;
  }

  // --- Modes ---
  &__modes {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__mode-card {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    background: var(--mode-color);
    border-radius: $radius-md;
    padding: $padding-md;
    transition: opacity 0.15s;

    &:active {
      opacity: 0.8;
    }
  }

  &__mode-icon {
    color: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
  }

  &__mode-label {
    @include title-sm;
    color: $white;
    flex: 1;
    text-align: left;
  }

  &__mode-arrow {
    color: rgba(255, 255, 255, 0.6);
    transform: rotate(180deg);
    flex-shrink: 0;
  }

  // --- Badges ---
  &__badges {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $gap-sm;
  }

  &__badge {
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-md;
    padding: $padding-sm;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    transition: background 0.15s;

    &:active {
      background: rgba(255, 255, 255, 0.09);
    }
  }

  &__badge-icon {
    font-size: 28px;
    line-height: 1;
  }

  &__badge-label {
    font-size: 10px;
    color: $muted;
    text-align: center;
    line-height: 1.3;
  }

  &__badges-empty {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-md;
    padding: $padding-md;
    @include text-sm;
    color: $muted;
    font-size: 13px;
    transition: background 0.15s;

    &:active {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}
</style>
