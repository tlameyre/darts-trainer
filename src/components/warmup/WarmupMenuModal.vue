<script setup>
import { ref, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'
import ZonePicker from '../ZonePicker.vue'

const props = defineProps({
  show:  { type: Boolean, required: true },
  zone:  { type: Object,  required: true },
})

const emit = defineEmits(['finish', 'quit', 'close', 'zone-change'])

const tempZone = ref({ ...props.zone })

watch(() => props.show, (val) => {
  if (val) tempZone.value = { ...props.zone }
})

function handleClose() {
  if (tempZone.value.sector !== props.zone.sector || tempZone.value.type !== props.zone.type) {
    emit('zone-change', { ...tempZone.value })
  }
  emit('close')
}
</script>

<template>
  <AppModal :show size="lg" title="Échauffement en cours" min-height="50dvh" @close="handleClose">
    <ZonePicker v-model="tempZone" />

    <div class="wm-modal__divider" />

    <div class="wm-modal__actions">
      <button class="wm-modal__item wm-modal__item--finish" @click="$emit('finish')">
        <AppIcon name="check" :width="20" :height="20" />
        Terminer la partie
      </button>

      <button class="wm-modal__item wm-modal__item--quit" @click="$emit('quit')">
        <AppIcon name="exit" :width="20" :height="20" />
        Quitter sans sauvegarder
      </button>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.wm-modal {
  &__divider {
    border-top: 1px solid rgba($white, 0.08);
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    @include text-sm;
    padding: $padding-md;
    border-radius: $radius-md;
    transition: background 0.15s;
    text-align: left;

    &:active { background: rgba($white, 0.06); }

    &--finish { color: $accent; }
    &--quit   { color: $error; }
  }
}

@media (min-width: $bp-laptop) {
  .wm-modal__item {
    @include text-md;
    padding: $padding-lg;
  }
}
</style>
