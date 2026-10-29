<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import OptionSelector from '../components/OptionSelector.vue'
import OptionTile from '../components/OptionTile.vue'
import AppButton from '../components/AppButton.vue'
import SettingsLayout from '../components/settings/SettingsLayout.vue'
import SettingsSection from '../components/settings/SettingsSection.vue'
import PlayerSetupSection from '../components/settings/PlayerSetupSection.vue'
import LegsStepper from '../components/settings/LegsStepper.vue'
import DashedAddButton from '../components/settings/DashedAddButton.vue'
import CustomValueInput from '../components/settings/CustomValueInput.vue'
import X01BotConfigModal from '../components/x01/X01BotConfigModal.vue'
import { useGameStore } from '../store/gameStore.js'
import { usePlayerSetup } from '../composables/usePlayerSetup.js'

const router    = useRouter()
const gameStore = useGameStore()

const SCORE_OPTIONS = [101, 170, 301, 501].map(value => ({ value, label: String(value) }))
  .concat({ value: 'custom', label: 'Perso' })

const settings = reactive({
  scoreKey:  301,
  legsToWin: 2,
  checkoutAnalysis: false,
})
const customScore   = ref(401)
const aiProfile     = ref(null)
const showBotConfig = ref(false)

const { players } = usePlayerSetup()

const isCustomScore  = computed(() => settings.scoreKey === 'custom')
const effectiveScore = computed(() =>
  isCustomScore.value ? Math.max(1, Number(customScore.value) || 501) : settings.scoreKey
)

const canAddBot = computed(() => !aiProfile.value && players.value.length === 1)

const legsPhrase = computed(() => players.value.length > 1 || aiProfile.value ? 'Premier à' : 'Partie en')

const PRINCIPLE = {
  text: "Pars du score de départ et descends jusqu'à zéro, en terminant sur un double. Premier à gagner les manches.",
  chips: ['Double out', 'Manches', 'DartBot'],
}

const recap = computed(() => {
  const count = players.value.length + (aiProfile.value ? 1 : 0)
  return [
    String(effectiveScore.value),
    `${count} joueur${count > 1 ? 's' : ''}`,
    `${settings.legsToWin} manche${settings.legsToWin > 1 ? 's' : ''}`,
    ...(settings.checkoutAnalysis ? ['Analyse des checkouts'] : []),
  ]
})

// Checkout analysis tile preview: the targets announced on a 81 finish
const SAMPLE_AIMS = ['T15', 'D18', '—']

function startGame() {
  gameStore.gameSettings = {
    mode:       'x01',
    startScore: effectiveScore.value,
    legsToWin:  settings.legsToWin,
    aiProfile:  aiProfile.value,
    players:    players.value,
    checkoutAnalysis: settings.checkoutAnalysis,
  }
  const needsStarterDraw = players.value.length > 1 && !aiProfile.value
  router.push({ name: needsStarterDraw ? 'x01-starter' : 'x01-game' })
}
</script>

<template>
  <SettingsLayout title="501" tone="green" :principle="PRINCIPLE" :recap="recap">
    <PlayerSetupSection
      v-model="players"
      :bot="aiProfile"
      @edit-bot="showBotConfig = true"
      @remove-bot="aiProfile = null"
    >
      <template v-if="canAddBot" #actions>
        <DashedAddButton @click="showBotConfig = true">DartBot</DashedAddButton>
      </template>
    </PlayerSetupSection>

    <template #side>
      <SettingsSection>
        <OptionSelector v-model="settings.scoreKey" label="Score de départ" :options="SCORE_OPTIONS" tone="green" />
        <CustomValueInput v-model="customScore" :show="isCustomScore" :max="9999" unit="pts" placeholder="ex : 701" />
      </SettingsSection>

      <LegsStepper v-model="settings.legsToWin" :phrase="legsPhrase" />

      <SettingsSection label="Options">
        <OptionTile
          v-model="settings.checkoutAnalysis"
          tone="green"
          title="Analyse des checkouts"
          description="Sous 170, indique ta cible avant chaque fléchette : revue de tes placements en fin de partie"
        >
          <template #preview>
            <div class="settings__aims">
              <span class="settings__preview-caption">Ex. · Reste 81</span>
              <span v-for="(aim, i) in SAMPLE_AIMS" :key="i" class="settings__aim">
                <span class="settings__aim-caption">Visé</span>
                {{ aim }}
              </span>
            </div>
          </template>
        </OptionTile>
      </SettingsSection>
    </template>

    <template #start>
      <AppButton size="cta" icon-end="arrow-right" tone="green" @click="startGame">Commencer</AppButton>
    </template>

    <template #modals>
      <X01BotConfigModal
        :show="showBotConfig"
        :model-value="aiProfile"
        @close="showBotConfig = false"
        @confirm="aiProfile = $event"
      />
    </template>
  </SettingsLayout>
</template>

<style lang="scss" scoped>
// Preview content — colors follow the tile's on/off state through currentColor
.settings {
  &__aims {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__preview-caption {
    @include text-xxs;
    flex: 1;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    opacity: 0.8;
  }

  &__aim {
    @include title-md;
    min-width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $padding-xxs 0;
    border-radius: $radius-sm;
    background: $bg;
    line-height: 1;
  }

  &__aim-caption {
    @include text-xxs;
    opacity: 0.75;
    text-transform: uppercase;
  }
}

.option-tile--on .settings__aim {
  background: rgba($white, 0.16);
}

@media (min-width: $bp-laptop) {
  .settings {
    &__preview-caption { @include text-xs; }
    &__aim { @include title-xl; min-width: 56px; }
    &__aim-caption { @include text-xs; }
  }
}
</style>
