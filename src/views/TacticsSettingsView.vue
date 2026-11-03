<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import SettingsLayout from '../components/settings/SettingsLayout.vue'
import PlayerSetupSection from '../components/settings/PlayerSetupSection.vue'
import LegsStepper from '../components/settings/LegsStepper.vue'
import { useGameStore } from '../store/gameStore.js'
import { usePlayerSetup } from '../composables/usePlayerSetup.js'

const router    = useRouter()
const gameStore = useGameStore()

const settings = reactive({ legsToWin: 1 })

const { players } = usePlayerSetup()

const PRINCIPLE = {
  text: 'Ferme les zones 20 à 12 puis Double, Triple et Bull, le plus vite possible. Façon cricket.',
  chips: ['20', '19', '18', '17', '16', '15', '14', '13', '12', 'D', 'T', 'Bull'],
}

const recap = computed(() => [
  `${players.value.length} joueur${players.value.length > 1 ? 's' : ''}`,
  `${settings.legsToWin} manche${settings.legsToWin > 1 ? 's' : ''}`,
])

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
  <SettingsLayout title="Tactics" tone="red" :principle="PRINCIPLE" :recap="recap">
    <PlayerSetupSection v-model="players" solo-hint="Laisse juste « Toi » pour jouer seul." />

    <template #side>
      <LegsStepper v-model="settings.legsToWin" phrase="Fin après" />
    </template>

    <template #start>
      <AppButton size="cta" icon-end="arrow-right" tone="red" @click="startGame">Commencer</AppButton>
    </template>
  </SettingsLayout>
</template>
