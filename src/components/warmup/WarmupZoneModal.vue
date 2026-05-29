<script setup>
import { ref, watch } from 'vue'
import ZonePicker from '../ZonePicker.vue'
import AppButton from '../AppButton.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  zone: { type: Object, required: true },
})

const emit = defineEmits(['update:show', 'confirm'])

const tempZone = ref({ ...props.zone })

watch(() => props.show, (val) => {
  if (val) tempZone.value = { ...props.zone }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="warmup-modal" @click.self="emit('update:show', false)">
        <div class="warmup-modal__sheet">
          <div class="warmup-modal__title">Changer de zone</div>
          <ZonePicker v-model="tempZone" />
          <div class="warmup-modal__actions">
            <AppButton size="small" rounded="full" variant="secondary" @click="emit('update:show', false)">Annuler
            </AppButton>
            <AppButton size="small" rounded="full" @click="emit('confirm', tempZone)">Confirmer</AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.warmup-modal {
  position: fixed;
  inset: 0;
  background: rgba($black, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 100;

  &__sheet {
    width: 100%;
    background: $bg;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: $padding-xl $padding-md $padding-xxl;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__title {
    @include title-lg;
    color: $white;
    text-align: center;
  }

  &__actions {
    display: flex;
    gap: $gap-xs;
    margin-top: $padding-xxs;

    .btn {
      flex: 1;
    }
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .warmup-modal__sheet,
.modal-leave-active .warmup-modal__sheet {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .warmup-modal__sheet,
.modal-leave-to .warmup-modal__sheet {
  transform: translateY(100%);
}
</style>
