<script setup>
import AppButton from '../AppButton.vue'
import AppModal from '../AppModal.vue'

defineProps({
  show:        { type: Boolean, required: true },
  finishLabel: { type: String, default: 'Terminer la partie' },
  quitLabel:   { type: String, default: 'Quitter sans sauvegarder' },
})

defineEmits(['finish', 'quit', 'close'])
</script>

<template>
  <AppModal :show title="Partie en cours" centered @close="$emit('close')">
    <div class="gm-modal">
      <AppButton size="md" tone="game" align="start" icon="check" @click="$emit('finish')">{{ finishLabel }}</AppButton>
      <AppButton size="md" variant="secondary" tone="danger" align="start" icon="exit" @click="$emit('quit')">{{ quitLabel }}</AppButton>
      <AppButton size="md" variant="secondary" align="start" icon="arrow-left" @click="$emit('close')">Reprendre la partie</AppButton>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.gm-modal {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
}
</style>
