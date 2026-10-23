<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import OptionSelector from '../components/OptionSelector.vue'
import StartButton from '../components/StartButton.vue'
import ZoneTypePicker from '../components/zone/ZoneTypePicker.vue'
import ZoneBoard from '../components/zone/ZoneBoard.vue'
import { useGameStore } from '../store/gameStore.js'

const router    = useRouter()
const gameStore = useGameStore()

const settings = reactive({
  duration: null,
  zones: [{ sector: 20, type: 'A' }],
})

const customMinutes = ref(10)

const durationOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: null, label: 'Infini' },
  { value: 'custom', label: 'Custom' },
]

const isCustomDuration = computed(() => settings.duration === 'custom')

function startGame() {
  const duration = settings.duration === 'custom'
    ? (Number(customMinutes.value) > 0 ? Number(customMinutes.value) : 5)
    : settings.duration
  gameStore.gameSettings = { mode: 'warmup', duration, zones: settings.zones }
  router.push({ name: 'warmup-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="Échauffement" tone="blue" @back="router.push({ name: 'home' })" />

    <main class="settings__main">
      <section class="settings__duration">
        <OptionSelector label="Durée de la session" tone="blue" :options="durationOptions" v-model="settings.duration" />
        <label v-if="isCustomDuration" class="settings__custom">
          <span class="settings__custom-label">Durée personnalisée</span>
          <input v-model="customMinutes" type="number" min="1" max="120" class="settings__custom-input" />
          <span class="settings__custom-label">min</span>
        </label>
      </section>

      <section class="settings__section">
        <h2 class="settings__label">Type de zones</h2>
        <ZoneTypePicker v-model="settings.zones" multiple />
      </section>

      <section class="settings__section settings__section--board">
        <div class="settings__board-head">
          <h2 class="settings__label">Zones à travailler</h2>
          <span class="settings__hint">Touche la cible</span>
        </div>
        <div class="settings__board">
          <ZoneBoard v-model="settings.zones" multiple />
        </div>
      </section>

      <StartButton class="settings__start" tone="blue" @click="startGame" />
    </main>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  @include safe-bottom($padding-md);

  &__main {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-lg $padding-md 0;
  }

  &__duration,
  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__custom {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__custom-label {
    @include title-sm;
    color: $muted;
  }

  &__custom-input {
    @include title-md;
    width: 80px;
    height: 44px;
    padding: 0 $padding-xs;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: transparent;
    color: $text-color;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $blue;
    }
  }

  &__board-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__hint {
    @include title-sm;
    color: $blue;
  }

  // The board takes the height left between the pickers and the start button
  &__section--board {
    flex: 1;
    min-height: 240px;
  }

  &__board {
    flex: 1;
    min-height: 0;
  }

  &__start {
    margin-top: auto;
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    @include safe-bottom(0px);

    &__main {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: auto auto 1fr auto;
      column-gap: $gap-xxl;
      row-gap: $gap-xxl;
      padding: $padding-xxl;
    }

    &__section--board {
      grid-column: 2;
      grid-row: 1 / -1;
      gap: $gap-sm;
    }

    &__start {
      grid-column: 1;
      grid-row: 4;
    }
  }
}
</style>
