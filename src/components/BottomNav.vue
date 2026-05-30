<script setup>
import AppIcon from './AppIcon.vue'

const tabs = [
  { name: 'home',  label: 'Accueil',  icon: 'home' },
  { name: 'play',  label: 'Jouer',    icon: 'plus-circle' },
  { name: 'stats', label: 'Stats',    icon: 'chart' },
]
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="tab in tabs"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="bottom-nav__tab"
      active-class="bottom-nav__tab--active"
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
    font-family: $font-title;
    font-size: $title-xs;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}
</style>
