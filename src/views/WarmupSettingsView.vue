<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import OptionSelector from '../components/OptionSelector.vue'
import AppButton from '../components/AppButton.vue'
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

const PRINCIPLE = {
  text: 'Enchaîne les volées sur les zones que tu choisis et suis ta précision, zone par zone.',
  chips: ['Simple', 'Double', 'Triple'],
}

const durationLabel = computed(() => {
  if (settings.duration === null) return 'Infini'
  const minutes = isCustomDuration.value ? customMinutes.value : settings.duration
  return `${minutes} min`
})

const recap = computed(() => [
  durationLabel.value,
  `${settings.zones.length} zone${settings.zones.length > 1 ? 's' : ''}`,
])

function startGame() {
  const duration = settings.duration === 'custom'
    ? (Number(customMinutes.value) > 0 ? Number(customMinutes.value) : 5)
    : settings.duration
  gameStore.gameSettings = { mode: 'warmup', duration, zones: settings.zones }
  router.push({ name: 'warmup-game' })
}
</script>

<template>
  <SettingsLayout title="Échauffement" tone="blue" back-to="home" scroll :principle="PRINCIPLE" :recap="recap">
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
      <AppButton size="cta" icon-end="arrow-right" tone="blue" @click="startGame">Commencer</AppButton>
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

  // The board is taken out of the flow so its size never pushes the page taller than the screen
  &__board {
    position: relative;
    flex: 1;
    min-height: 0;

    :deep(.board) {
      position: absolute;
      inset: 0;
    }
  }
}
</style>
