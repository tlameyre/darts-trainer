<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/gameStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import StartButton from '../components/StartButton.vue'
import X01PlayerOrderList from '../components/x01/X01PlayerOrderList.vue'

const router    = useRouter()
const gameStore = useGameStore()

const MOCK_PLAYERS = [
  { id: 'mock-1', name: 'Toi', isMe: true },
  { id: 'mock-2', name: 'Bob', isFriend: true },
]

const settings = gameStore.gameSettings ?? { players: MOCK_PLAYERS }

function shuffle(list) {
  const shuffled = [...list]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const order = ref(shuffle(settings.players ?? MOCK_PLAYERS))
const opener = computed(() => order.value[0])

function reshuffle() {
  order.value = shuffle(order.value)
}

function confirmOrder() {
  if (gameStore.gameSettings) gameStore.gameSettings.players = order.value
  router.push({ name: 'x01-game' })
}
</script>

<template>
  <div class="starter">
    <AppHeader title="Qui commence ?" tone="green" @back="router.push({ name: 'x01-settings' })" />

    <main class="starter__main">
      <div class="starter__draw">
        <section class="starter__opener">
          <AppIcon class="starter__opener-bg" name="dartboard" :width="140" :height="140" />
          <span
            class="starter__avatar"
            :class="{ 'starter__avatar--me': opener.isMe, 'starter__avatar--guest': opener.isGuest }"
          >{{ opener.name?.[0]?.toUpperCase() ?? '?' }}</span>
          <span class="starter__opener-text">
            <span class="starter__kicker">Tiré au sort · lance en premier</span>
            <span class="starter__name">{{ opener.name }}</span>
          </span>
        </section>

        <p class="starter__hint">
          L'ordre a été tiré au sort. Garde-le, relance un tirage ou glisse les joueurs
          pour choisir toi-même qui ouvre la partie.
        </p>

        <button class="starter__reshuffle" @click="reshuffle">
          <AppIcon name="dice" :width="20" :height="20" />
          Nouveau tirage
        </button>
      </div>

      <div class="starter__order">
        <section class="starter__list">
          <div class="starter__list-head">
            <span class="starter__list-title">Ordre de passage</span>
            <span class="starter__list-hint">Glisse pour réorganiser</span>
          </div>
          <X01PlayerOrderList v-model="order" />
        </section>

        <StartButton class="starter__start" tone="green" @click="confirmOrder" />
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.starter {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-lg $padding-md 0;
    @include safe-bottom($padding-xl);
  }

  // Mobile order: opener card, player list, reshuffle, then start at the bottom
  &__draw,
  &__order { display: contents; }

  &__opener {
    order: 1;
    position: relative;
    display: flex;
    align-items: center;
    gap: $gap-md;
    padding: $padding-md;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
    overflow: hidden;
  }

  &__opener-bg {
    position: absolute;
    right: -28px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.07;
  }

  &__avatar {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $blue;
    color: $white;
    @include title-xxl;

    &--me    { background: $error; }
    &--guest { background: $muted; }
  }

  &__opener-text {
    position: relative;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__kicker {
    @include text-xs;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: $tracking-lg;
    opacity: 0.7;
  }

  &__name {
    @include title-xxxl;
    line-height: 0.9;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__hint { display: none; }

  &__list {
    order: 2;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__list-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__list-title {
    @include title-sm;
    color: $muted;
  }

  &__list-hint {
    @include text-xs;
    color: $muted;
  }

  &__reshuffle {
    order: 3;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-xs;
    border-radius: $radius-sm;
    border: $border-md solid $text-color;
    color: $text-color;
    @include title-sm;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__start {
    order: 4;
    margin-top: auto;
  }
}

@media (min-width: $bp-laptop) {
  .starter {
    &__main {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0;
      padding: 0;
    }

    &__opener,
    &__list,
    &__reshuffle,
    &__start { order: 0; }

    &__draw,
    &__order {
      display: flex;
      flex-direction: column;
      padding: $padding-xxl;
      gap: $gap-xl;
    }

    &__order {
      gap: $gap-xxl;
      border-left: $border-sm solid $border-color;
    }

    &__opener   { padding: $padding-xl; }
    &__avatar   { width: 88px; height: 88px; @include title-xxxl; }
    &__kicker   { @include text-sm; }
    &__name     { @include display-sm; }
    &__hint     { display: block; @include text-md; color: $muted; }
    &__list     { gap: $gap-sm; }
    &__list-title { @include title-md; }
    &__list-hint  { @include text-sm; }
    &__reshuffle  { height: 56px; @include title-md; }
    &__start      { height: 64px; @include title-xxl; }
  }
}
</style>
