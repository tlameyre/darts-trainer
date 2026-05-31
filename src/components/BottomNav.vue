<script setup>
import AppIcon from './AppIcon.vue'

import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'home',    label: 'Accueil', icon: 'home' },
  { name: 'play',    label: 'Jouer',   icon: 'dartboard' },
  { name: 'stats',   label: 'Stats',   icon: 'chart' },
  { name: 'profile', label: 'Profil',  icon: 'user' },
]

// L'onglet profil est actif sur /profile, /profile/edit et /profile/badges
const profileRoutes = new Set(['profile', 'profile-edit', 'badges'])
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="tab in tabs"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="bottom-nav__tab"
      :class="{
        'bottom-nav__tab--active':
          tab.name === 'profile'
            ? profileRoutes.has(route.name)
            : route.name === tab.name
      }"
    >
      <AppIcon :name="tab.icon" :width="24" :height="24" />
      <span class="bottom-nav__label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<style lang="scss" scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba($bg, 0.92);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: stretch;
  z-index: 50;
  padding-bottom: env(safe-area-inset-bottom);

  &__tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: $muted;
    text-decoration: none;
    transition: color 0.15s;

    &--active {
      color: $orange;
    }

    &:active {
      opacity: 0.7;
    }
  }

  &__label {
    @include title-xs;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}
</style>
