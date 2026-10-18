<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'
import ToggleSwitch from '../ToggleSwitch.vue'
import { isPowerOfTwo } from '../../composables/useTournamentBracket.js'
import { playoffSizeOptions } from '../../composables/useChampionship.js'

const props = defineProps({
  show:             { type: Boolean, required: true },
  participantCount: { type: Number, required: true },
  format:           { type: String, default: 'bracket' },
})

const emit = defineEmits(['close', 'confirm'])

const manualSeeding     = ref(false)
const doubleElimination = ref(false)
const doubleRoundRobin  = ref(false)
const playoffSize       = ref(null)

const isChampionship = computed(() => props.format === 'championship')
const isPow2         = computed(() => isPowerOfTwo(props.participantCount))
const playoffOptions = computed(() => [
  { size: null, label: 'Aucun' },
  ...playoffSizeOptions(props.participantCount).map(size => ({ size, label: size === 2 ? 'Finale' : `Top ${size}` })),
])

watch(isPow2, (ok) => { if (!ok) doubleElimination.value = false })
watch(() => props.participantCount, (count) => {
  if (playoffSize.value > count) playoffSize.value = null
})

function confirm() {
  emit('confirm', {
    seedingMethod:     manualSeeding.value ? 'manual' : 'random',
    doubleElimination: doubleElimination.value,
    doubleRoundRobin:  doubleRoundRobin.value,
    playoffSize:       playoffSize.value,
  })
}
</script>

<template>
  <AppModal :show="show" title="Démarrer le tournoi" size="sm" @close="$emit('close')">
    <div class="start-modal">
      <template v-if="isChampionship">
        <ToggleSwitch
          v-model="doubleRoundRobin"
          title="Aller-retour"
          description="Chaque paire de joueurs s'affronte deux fois."
        />
        <div class="start-modal__field">
          <span class="start-modal__label">Playoffs</span>
          <span class="start-modal__desc">Les premiers du classement se qualifient pour un bracket final.</span>
          <div class="start-modal__options">
            <AppButton
              v-for="o in playoffOptions" :key="o.label"
              size="small" variant="ghost" :active="playoffSize === o.size"
              @click="playoffSize = o.size"
            >{{ o.label }}</AppButton>
          </div>
        </div>
      </template>
      <template v-else>
        <ToggleSwitch
          v-model="manualSeeding"
          title="Seeding manuel"
          description="Sinon, tirage au sort à l'instant du démarrage."
        />
        <ToggleSwitch
          :model-value="doubleElimination"
          title="Bracket perdants"
          :description="isPow2
            ? 'Double élimination : les perdants ont une seconde chance.'
            : `Nécessite un nombre de participants puissance de 2 (4, 8, 16...) — actuellement ${participantCount}.`"
          :class="{ 'start-modal__toggle--disabled': !isPow2 }"
          @update:model-value="val => { if (isPow2) doubleElimination = val }"
        />
      </template>
      <AppButton @click="confirm">Démarrer</AppButton>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.start-modal {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;

  &__toggle--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__label {
    @include title-lg;
    color: $white;
  }

  &__desc {
    @include text-sm;
    color: $muted;
  }

  &__options {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs;

    :deep(.btn) { flex: 1; }
  }
}
</style>
