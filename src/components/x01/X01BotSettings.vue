<script setup>
import { ref, computed } from 'vue'
import ToggleSwitch from '../ToggleSwitch.vue'
import AppSlider from '../AppSlider.vue'
import { AI_LEVELS } from '../../composables/useX01AI.js'

const props = defineProps({
  modelValue: { type: Object, default: null }, // null = pas de bot, sinon profil
})

const emit = defineEmits(['update:modelValue'])

const enabled     = ref(!!props.modelValue)
const level       = ref(props.modelValue?.level ?? 5)
const customMode  = ref(!props.modelValue?.level && !!props.modelValue)
const customAvg   = ref(AI_LEVELS.findIndex(l => l.avgVolley === props.modelValue?.avgVolley) + 1 || 5)
const customCo    = ref(AI_LEVELS.findIndex(l => l.checkoutRate === props.modelValue?.checkoutRate) + 1 || 5)

const AVG_STEPS      = AI_LEVELS.map(l => l.avgVolley)
const CHECKOUT_STEPS = AI_LEVELS.map(l => l.checkoutRate)

const profile = computed(() => {
  if (!enabled.value) return null
  if (customMode.value) {
    return {
      level:        null,
      label:        'Custom',
      avgVolley:    AVG_STEPS[customAvg.value - 1],
      checkoutRate: CHECKOUT_STEPS[customCo.value - 1],
    }
  }
  return AI_LEVELS[level.value - 1]
})

// Émet à chaque changement
function update() {
  emit('update:modelValue', profile.value)
}

const hint = computed(() => {
  if (!profile.value) return ''
  return `Moy. ${profile.value.avgVolley} pts/volée · ${Math.round(profile.value.checkoutRate * 100)}% aux checkouts`
})
</script>

<template>
  <div class="bot-settings">

    <ToggleSwitch
      v-model="enabled"
      title="Adversaire DartBot"
      description="Joue contre une IA qui simule un adversaire humain"
      @update:modelValue="update"
    />

    <Transition name="slide-fade">
      <div v-if="enabled" class="bot-settings__body">

        <Transition name="slide-fade">
          <AppSlider
            v-if="!customMode"
            v-model="level"
            :min="1"
            :max="10"
            label="Niveau"
            :value-label="`${level} — ${AI_LEVELS[level - 1].label}`"
            @update:modelValue="update"
          />
        </Transition>

        <ToggleSwitch
          v-model="customMode"
          title="Niveau custom"
          description="Définis toi-même les stats du DartBot"
          @update:modelValue="update"
        />

        <Transition name="slide-fade">
          <div v-if="customMode" class="bot-settings__custom">
            <AppSlider
              v-model="customAvg"
              :min="1"
              :max="10"
              label="Moyenne par volée"
              :value-label="`${AVG_STEPS[customAvg - 1]} pts`"
              @update:modelValue="update"
            />
            <AppSlider
              v-model="customCo"
              :min="1"
              :max="10"
              label="Taux de checkout"
              :value-label="`${Math.round(CHECKOUT_STEPS[customCo - 1] * 100)} %`"
              @update:modelValue="update"
            />
          </div>
        </Transition>

        <p class="bot-settings__hint">{{ hint }}</p>

      </div>
    </Transition>

  </div>
</template>

<style lang="scss" scoped>
.bot-settings {
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__body {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__custom {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__hint {
    @include title-sm;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .bot-settings__hint { @include title-md; }
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
