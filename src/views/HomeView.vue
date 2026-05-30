<script setup>
import { profile } from '../store/authStore.js'
</script>

<template>
  <div class="home">
    <header class="home__header">
      <div>
        <p class="home__greeting">Bonjour,</p>
        <h1 class="home__name">{{ profile?.username ?? 'Joueur' }}</h1>
      </div>
    </header>

    <main class="home__main">
      <!-- Contenu à définir -->
      <p class="home__placeholder">Contenu à venir…</p>
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
  }

  &__greeting {
    @include text-sm;
    color: $muted;
  }

  &__name {
    @include title-xl;
    font-size: 32px;
    line-height: 1;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__placeholder {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }
}
</style>
