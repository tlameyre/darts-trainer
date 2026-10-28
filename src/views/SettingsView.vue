<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import OptionSelector from '../components/OptionSelector.vue'
import OptionTile from '../components/OptionTile.vue'
import StartButton from '../components/StartButton.vue'
import SettingsLayout from '../components/settings/SettingsLayout.vue'
import SettingsSection from '../components/settings/SettingsSection.vue'
import { useGameStore } from '../store/gameStore.js'

const router = useRouter()
const gameStore = useGameStore()

const settings = reactive({
  difficulty: 'easy',
  maxQuestions: 10,
  timeLimit: null,
  doubleValidation: false,
  showDartValue: false,
})

const difficultyOptions = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
]

const questionOptions = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: null, label: 'Infini' },
]

const timeOptions = [
  { value: 15, label: '15 s' },
  { value: 30, label: '30 s' },
  { value: null, label: 'Libre' },
]

// Sample volley shown in the option previews
const doubleSteps = [
  { label: 'Score volée', value: 89 },
  { label: 'Nouveau reste', value: 119 },
]

const sampleDarts = [
  { label: 'T20', value: 60 },
  { label: '19', value: 19 },
  { label: 'D5', value: 10 },
]

function startGame() {
  gameStore.gameSettings = { ...settings }
  router.push({ name: 'score-game' })
}
</script>

<template>
  <SettingsLayout title="Calcul" back-to="home">
    <OptionSelector label="Difficulté des volées" :options="difficultyOptions" v-model="settings.difficulty" />
    <OptionSelector label="Nombre de questions" :options="questionOptions" v-model="settings.maxQuestions" />
    <OptionSelector label="Temps par question" :options="timeOptions" v-model="settings.timeLimit" />

    <template #side>
      <SettingsSection label="Options">
        <div class="settings__tiles">
          <OptionTile
            v-model="settings.doubleValidation"
            title="Double calcul"
            description="Après une bonne réponse, calcule aussi le score restant"
          >
            <template #preview>
              <span class="settings__preview-caption">Ex. · Reste 208 · T19 25 7</span>
              <div v-for="(step, i) in doubleSteps" :key="step.label" class="settings__step">
                <span class="settings__step-num">{{ i + 1 }}</span>
                <span class="settings__step-label">{{ step.label }}</span>
                <span class="settings__step-value">{{ step.value }}</span>
              </div>
            </template>
          </OptionTile>

          <OptionTile
            v-model="settings.showDartValue"
            title="Valeur des fléchettes"
            description="Affiche les points sous chaque fléchette (60 sous T20)"
          >
            <template #preview>
              <span class="settings__preview-caption">Ex. · en partie</span>
              <div class="settings__darts">
                <div v-for="dart in sampleDarts" :key="dart.label" class="settings__dart">
                  <span class="settings__dart-label">{{ dart.label }}</span>
                  <span class="settings__dart-value">{{ dart.value }}</span>
                </div>
              </div>
            </template>
          </OptionTile>
        </div>
      </SettingsSection>
    </template>

    <template #start>
      <StartButton @click="startGame" />
    </template>
  </SettingsLayout>
</template>

<style lang="scss" scoped>
.settings {
  &__tiles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
  }

  // Preview content — colors follow the tile's on/off state through currentColor
  &__preview-caption {
    @include text-xxs;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    opacity: 0.8;
  }

  &__step {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__step-num {
    @include title-xxs;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border-radius: $radius-sm;
    background: $black;
    color: $white;
  }

  &__step-label {
    @include text-xs;
    flex: 1;
    text-transform: uppercase;
    opacity: 0.9;
  }

  &__step-value {
    @include title-lg;
    line-height: 1;
  }

  &__darts {
    display: flex;
    gap: $gap-xxs;
  }

  &__dart {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    padding: $padding-xxs 0;
    border-radius: $radius-sm;
    background: $bg;
  }

  &__dart-label {
    @include title-md;
    line-height: 1;
  }

  &__dart-value {
    @include title-xxs;
    padding: 0 $padding-xxs;
    border-radius: $radius-sm;
    background: $black;
    color: $white;
  }

}

// Active tile: invert the preview chips so they stay readable on orange
.option-tile--on {
  .settings__step-num {
    background: $white;
    color: $orange;
  }

  .settings__dart {
    background: rgba($white, 0.16);
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    &__tiles {
      gap: $gap-sm;
    }

    &__preview-caption {
      @include text-xs;
    }

    &__step-num {
      @include title-sm;
      width: 24px;
      height: 24px;
    }

    &__step-label {
      @include text-sm;
    }

    &__step-value {
      @include title-xxl;
    }

    &__dart {
      padding: $padding-xs 0;
    }

    &__dart-label {
      @include title-xxl;
    }

    &__dart-value {
      @include title-sm;
    }
  }
}
</style>
