<script setup>
import { ref } from 'vue'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'

defineProps({
  show: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'save'])

const newPassword    = ref('')
const confirmPassword = ref('')
const error          = ref('')

function onSave() {
  error.value = ''
  if (newPassword.value.length < 6) {
    error.value = 'Le mot de passe doit faire au moins 6 caractères.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  emit('save', newPassword.value)
  newPassword.value    = ''
  confirmPassword.value = ''
}

function onClose() {
  newPassword.value    = ''
  confirmPassword.value = ''
  error.value          = ''
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal" @click.self="onClose">
      <div class="modal__panel">
        <div class="modal__header">
          <span class="modal__title">Changer de mot de passe</span>
          <button class="modal__close" @click="onClose">
            <AppIcon name="close" :width="18" :height="18" />
          </button>
        </div>

        <div class="modal__field">
          <label class="modal__label">Nouveau mot de passe</label>
          <input
            v-model="newPassword"
            class="modal__input"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>

        <div class="modal__field">
          <label class="modal__label">Confirmer</label>
          <input
            v-model="confirmPassword"
            class="modal__input"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>

        <p v-if="error" class="modal__error">{{ error }}</p>

        <AppButton variant="primary" @click="onSave">Mettre à jour</AppButton>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 100;

  &__panel {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    background: #1e2a26;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: $padding-md $padding-md $padding-xxl;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: $gap-sm;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__close {
    color: $muted;
    display: flex;
    align-items: center;
    &:active { color: $text-color; }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__label {
    @include text-sm;
    color: $muted;
  }

  &__input {
    @include text-sm;
    background: rgba(255, 255, 255, 0.07);
    border: $border-sm solid rgba(255, 255, 255, 0.15);
    border-radius: $radius-md;
    color: $text-color;
    padding: $padding-sm $padding-md;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: rgba(255,255,255,0.2); }
    &:focus { border-color: rgba(255, 255, 255, 0.4); }
  }

  &__error {
    @include text-sm;
    color: $error;
  }
}

.modal-enter-active,
.modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
