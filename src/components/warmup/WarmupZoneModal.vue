<script setup>
import { ref, watch } from 'vue'
import ZonePicker from '../ZonePicker.vue'

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
            <button class="warmup-modal__btn warmup-modal__btn--cancel" @click="emit('update:show', false)">Annuler</button>
            <button class="warmup-modal__btn warmup-modal__btn--confirm" @click="emit('confirm', tempZone)">Confirmer</button>
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
    background: $surface;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: $padding-xl $padding-md $padding-xxl;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__title {
    font-family: $font-title;
    font-size: $title-xs;
    color: $white;
    text-align: center;
  }

  &__actions {
    display: flex;
    gap: $gap-xs;
    margin-top: $padding-xxs;
  }

  &__btn {
    flex: 1;
    border-radius: $radius-pill;
    font-size: $text-sm;
    font-weight: 700;
    padding: $padding-sm;
    transition: transform 0.1s, opacity 0.15s;
    &:active { transform: scale(0.97); opacity: 0.85; }
    &--cancel  { background: rgba($white, 0.08); border: 1px solid rgba($white, 0.08); color: $muted; }
    &--confirm { background: $blue; color: $white; }
  }
}

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .warmup-modal__sheet,
.modal-leave-active .warmup-modal__sheet { transition: transform 0.25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .warmup-modal__sheet,
.modal-leave-to .warmup-modal__sheet { transform: translateY(100%); }
</style>
