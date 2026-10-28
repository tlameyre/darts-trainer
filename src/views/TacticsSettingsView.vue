<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import StartButton from '../components/StartButton.vue'
import SettingsLayout from '../components/settings/SettingsLayout.vue'
import PlayerSetupSection from '../components/settings/PlayerSetupSection.vue'
import LegsStepper from '../components/settings/LegsStepper.vue'
import { useGameStore } from '../store/gameStore.js'
import { usePlayerSetup } from '../composables/usePlayerSetup.js'

const router    = useRouter()
const gameStore = useGameStore()

const settings = reactive({ legsToWin: 1 })

const { players } = usePlayerSetup()

function startGame() {
  gameStore.gameSettings = {
    mode:      'tactics',
    legsToWin: settings.legsToWin,
    players:   players.value,
  }
  const needsStarterDraw = players.value.length > 1
  router.push({ name: needsStarterDraw ? 'tactics-starter' : 'tactics-game' })
}
</script>

<template>
  <SettingsLayout title="Tactics" tone="red">
    <PlayerSetupSection v-model="players" solo-hint="Laisse juste « Toi » pour jouer seul." />

    <template #side>
      <LegsStepper v-model="settings.legsToWin" phrase="Fin après" />
    </template>

    <template #start>
      <StartButton tone="red" @click="startGame" />
    </template>
  </SettingsLayout>
</template>
