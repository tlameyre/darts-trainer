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
    <label class="cp-modal__field">
      <span class="cp-modal__label">Nouveau mot de passe</span>
      <input
        v-model="newPassword"
        class="cp-modal__input"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
      />
    </label>

    <label class="cp-modal__field">
      <span class="cp-modal__label">Confirmer</span>
      <input
        v-model="confirmPassword"
        class="cp-modal__input"
        type="password"
        placeholder="••••••••"
        autocomplete="new-password"
      />
    </label>

    <p v-if="error" class="cp-modal__error">{{ error }}</p>

    <AppButton size="cta" tone="black" @click="onSave">Mettre à jour</AppButton>
  </AppModal>
</template>

<style lang="scss" scoped>
.cp-modal {
  &__field {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__label {
    @include text-xs;
    font-weight: 600;
    color: $muted;
  }

  &__input {
    @include text-md;
    height: 48px;
    padding: 0 $padding-sm;
    background: $white;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: $input-placeholder; }
    &:focus { border-color: $black; }
  }

  &__error {
    @include text-sm;
    color: $error;
  }
}

@media (min-width: $bp-laptop) {
  .cp-modal {
    &__label { @include text-sm; }
    &__input { @include text-lg; height: 52px; }
    &__error { @include text-md; }
  }
}
</style>
