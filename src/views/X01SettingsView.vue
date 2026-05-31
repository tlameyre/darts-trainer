<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import { gameSettings } from '../store/gameStore.js'

const router = useRouter()

const SCORE_OPTIONS = [301, 501]
const LEGS_OPTIONS  = [1, 2, 3, 5]

const settings = reactive({
  scoreKey:  501,   // 301 | 501 | 'custom'
  legsToWin: 2,
})
const customScore = ref(401)

const isCustomScore = computed(() => settings.scoreKey === 'custom')

const effectiveScore = computed(() => {
  if (isCustomScore.value) return Math.max(1, Number(customScore.value) || 501)
  return settings.scoreKey
})

function startGame() {
  gameSettings.value = {
    mode:      'x01',
    startScore: effectiveScore.value,
    legsToWin:  settings.legsToWin,
  }
  router.push({ name: 'x01-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="501" @back="router.push({ name: 'play' })" />

    <main class="settings__main">

      <!-- Score de départ -->
      <div class="settings__card">
        <div class="settings__section-label">Score de départ</div>
        <div class="settings__score-row">
          <AppButton
            v-for="s in SCORE_OPTIONS"
            :key="s"
            size="small"
            variant="ghost"
            :active="settings.scoreKey === s"
            @click="settings.scoreKey = s"
          >
            {{ s }}
          </AppButton>
          <AppButton
            size="small"
            variant="ghost"
            :active="isCustomScore"
            @click="settings.scoreKey = 'custom'"
          >
            Custom
          </AppButton>
        </div>
        <Transition name="slide-fade">
          <div v-if="isCustomScore" class="settings__custom-field">
            <input
              v-model.number="customScore"
              type="number"
              min="1"
              max="9999"
              class="settings__custom-input"
              placeholder="ex: 701"
            />
            <span class="settings__custom-label">pts</span>
          </div>
        </Transition>
      </div>

      <!-- Nombre de manches -->
      <div class="settings__card">
        <div class="settings__section-label">Manches à gagner</div>
        <div class="settings__legs-row">
          <AppButton
            v-for="l in LEGS_OPTIONS"
            :key="l"
            size="small"
            variant="ghost"
            :active="settings.legsToWin === l"
            @click="settings.legsToWin = l"
          >
            {{ l }}
          </AppButton>
        </div>
        <p class="settings__legs-hint">
          La partie se termine après {{ settings.legsToWin }} manche{{ settings.legsToWin > 1 ? 's' : '' }}.
        </p>
      </div>

    </main>

    <AppButton @click="startGame">COMMENCER</AppButton>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 420px;
    width: 100%;
    margin: 0 auto;
    gap: $gap-xxl;
    padding: $padding-md 0;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__section-label {
    @include title-lg;
    color: $white;
  }

  &__score-row,
  &__legs-row {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) {
      flex: 1;
    }
  }

  &__custom-field {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__custom-input {
    flex: 1;
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    @include title-md;
    padding: $padding-xs $padding-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__custom-label {
    @include title-md;
    color: $muted;
    white-space: nowrap;
  }

  &__legs-hint {
    @include title-sm;
    color: $muted;
  }

  :deep(.btn:last-child) {
    max-width: 420px;
    margin: 0 auto;
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
