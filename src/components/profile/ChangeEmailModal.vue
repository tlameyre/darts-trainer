<script setup>
import { ref } from 'vue'
import AppButton from '../AppButton.vue'
import AppModal from '../AppModal.vue'

defineProps({
  show:         { type: Boolean, required: true },
  currentEmail: { type: String,  default: '' },
})

const emit = defineEmits(['close', 'save'])

const newEmail = ref('')
const error    = ref('')

function onSave() {
  error.value = ''
  if (!newEmail.value.trim()) { error.value = 'Saisis un email valide.'; return }
  emit('save', newEmail.value.trim())
  newEmail.value = ''
}

function onClose() {
  newEmail.value = ''
  error.value    = ''
  emit('close')
}
</script>

<template>
  <AppModal :show title="Changer d'adresse email" @close="onClose">
    <p class="ce-modal__current">Actuel : <strong>{{ currentEmail }}</strong></p>

    <div class="ce-modal__field">
      <label class="ce-modal__label">Nouvel email</label>
      <input
        v-model="newEmail"
        class="ce-modal__input"
        type="email"
        placeholder="nouveau@email.com"
        autocomplete="email"
      />
    </div>

    <p v-if="error" class="ce-modal__error">{{ error }}</p>

    <p class="ce-modal__hint">Un email de confirmation sera envoyé à la nouvelle adresse.</p>

    <AppButton variant="primary" @click="onSave">Envoyer la confirmation</AppButton>
  </AppModal>
</template>

<style lang="scss" scoped>
.ce-modal {
  &__current {
    @include text-sm;
    color: $muted;
    strong { color: $text-color; }
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

  &__hint {
    @include title-sm;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .ce-modal {
    &__current { @include text-md; }
    &__label   { @include text-md; }
    &__input   { @include text-md; padding: $padding-md $padding-lg; }
    &__error   { @include text-md; }
    &__hint    { @include title-md; }
  }
}
</style>
