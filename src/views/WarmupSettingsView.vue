<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import OptionSelector from '../components/OptionSelector.vue'
import StartButton from '../components/StartButton.vue'
import SettingsLayout from '../components/settings/SettingsLayout.vue'
import SettingsSection from '../components/settings/SettingsSection.vue'
import CustomValueInput from '../components/settings/CustomValueInput.vue'
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
  <SettingsLayout title="Échauffement" tone="blue" back-to="home" scroll>
    <SettingsSection>
      <OptionSelector label="Durée de la session" tone="blue" :options="durationOptions" v-model="settings.duration" />
      <CustomValueInput v-model="customMinutes" :show="isCustomDuration" :max="120" unit="min" />
    </SettingsSection>

    <SettingsSection label="Type de zones">
      <ZoneTypePicker v-model="settings.zones" multiple />
    </SettingsSection>

    <template #side>
      <SettingsSection class="settings__board-section" label="Zones à travailler" hint="Touche la cible">
        <div class="settings__board">
          <ZoneBoard v-model="settings.zones" multiple />
        </div>
      </SettingsSection>
    </template>

    <template #start>
      <StartButton tone="blue" @click="startGame" />
    </template>
  </SettingsLayout>
</template>

<style lang="scss" scoped>
// The board takes the height left between the pickers and the start button
.settings {
  &__board-section {
    flex: 1;
    min-height: 240px;
  }

  &__board {
    flex: 1;
    min-height: 0;
  }
}
</style>
