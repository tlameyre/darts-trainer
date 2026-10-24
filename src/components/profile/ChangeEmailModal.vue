<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'
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
    <div class="ce-modal__current">
      <span class="ce-modal__current-label">Adresse actuelle</span>
      <span class="ce-modal__current-value">{{ currentEmail }}</span>
    </div>

    <label class="ce-modal__field">
      <span class="ce-modal__label">Nouvel email</span>
      <input
        v-model="newEmail"
        class="ce-modal__input"
        type="email"
        placeholder="nom@exemple.com"
        autocomplete="email"
      />
    </label>

    <p v-if="error" class="ce-modal__error">{{ error }}</p>

    <p class="ce-modal__hint">
      <AppIcon name="mail" :width="18" :height="18" />
      Un email de confirmation sera envoyé à la nouvelle adresse. Le changement s'applique une fois le lien cliqué.
    </p>

    <button class="ce-modal__submit" @click="onSave">Envoyer la confirmation</button>
  </AppModal>
</template>

<style lang="scss" scoped>
.ce-modal {
  &__current {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__current-label {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $muted;
  }

  &__current-value {
    @include text-md;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

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
    border: $border-md solid $black;
    border-radius: $radius-sm;
    color: $text-color;
    outline: none;

    &::placeholder { color: $input-placeholder; }
  }

  &__error {
    @include text-sm;
    color: $error;
  }

  &__hint {
    @include text-sm;
    display: flex;
    align-items: flex-start;
    gap: $gap-xs;
    line-height: 1.4;
    color: $muted;

    svg { margin-top: 1px; }
  }

  &__submit {
    @include title-xl;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 56px;
    border-radius: $radius-sm;
    background: $black;
    color: $bg;
    text-transform: uppercase;
    transition: opacity 0.15s;

    &:active { opacity: 0.85; }
  }
}

@media (min-width: $bp-laptop) {
  .ce-modal {
    &__current-value { @include text-lg; }
    &__label   { @include text-sm; }
    &__input   { @include text-lg; height: 52px; }
    &__error   { @include text-md; }
    &__hint    { @include text-md; }
  }
}
</style>
