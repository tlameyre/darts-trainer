<script setup>
import { useRouter } from 'vue-router'
import { GAME_MODES } from '../data/gameModes.js'

const router = useRouter()

function selectMode(mode) {
  router.push({ name: mode.settingsRoute })
}
</script>

<template>
  <div class="lobby">
    <header class="lobby__header">
      <h1 class="lobby__title">DARTS<br>TRAINER</h1>
    </header>

    <main class="lobby__modes">
      <button v-for="mode in GAME_MODES" :key="mode.id" class="mode-card" :style="{ '--mode-color': mode.color }"
        @click="selectMode(mode)">
        <h2 class="mode-card__title">{{ mode.title }}</h2>
        <p class="mode-card__desc">{{ mode.description }}</p>
      </button>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.lobby {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md $padding-xl;
  gap: $padding-xl;

  &__header {
    display: flex;
    flex-direction: column;
    gap: $padding-xxs;
    padding-top: $padding-lg;
  }

  &__sub {
    font-size: $text-xs;
    font-weight: 700;
    color: $orange;
    text-transform: uppercase;
  }

  &__title {
    @include title-xl;
    font-size: 32px;
    line-height: .9;
  }

  &__modes {
    display: flex;
    flex-direction: column;
    gap: $padding-sm;
    flex: 1;
  }
}

.mode-card {
  width: 100%;
  background: var(--mode-color);
  border-radius: $radius-lg;
  padding: $padding-lg;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: $padding-xs;
  transition: transform 0.15s, opacity 0.15s;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }

  &__title {
    @include title-lg;
    line-height: 100%;
    color: $white;
  }

  &__desc {
    @include text-sm;
    color: rgba($white, 0.75);
  }
}
</style>
