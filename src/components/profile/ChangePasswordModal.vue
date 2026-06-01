<script setup>
import { ref } from 'vue'
import AppButton from '../AppButton.vue'
import AppModal from '../AppModal.vue'

defineProps({
  show: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'save'])

const newPassword     = ref('')
const confirmPassword = ref('')
const error           = ref('')

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
  newPassword.value     = ''
  confirmPassword.value = ''
}

function onClose() {
  newPassword.value     = ''
  confirmPassword.value = ''
  error.value           = ''
  emit('close')
}
</script>

<template>
  <AppModal :show title="Changer de mot de passe" @close="onClose">
    <div class="cp-modal__field">
      <label class="cp-modal__label">Nouveau mot de passe</label>
      <input
        v-model="newPassword"
        class="cp-modal__input"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
      />
    </div>

    <div class="cp-modal__field">
      <label class="cp-modal__label">Confirmer</label>
      <input
        v-model="confirmPassword"
        class="cp-modal__input"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
      />
    </div>

    <p v-if="error" class="cp-modal__error">{{ error }}</p>

    <AppButton variant="primary" @click="onSave">Mettre à jour</AppButton>
  </AppModal>
</template>

<style lang="scss" scoped>
.cp-modal {
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
    background: rgba($white, 0.07);
    border: $border-sm solid rgba($white, 0.15);
    border-radius: $radius-md;
    color: $text-color;
    padding: $padding-sm $padding-md;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: rgba($white, 0.2); }
    &:focus { border-color: rgba($white, 0.4); }
  }

  &__error {
    @include text-sm;
    color: $error;
  }
}
</style>
