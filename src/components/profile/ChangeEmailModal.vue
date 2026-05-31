<script setup>
import { ref } from 'vue'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'

defineProps({
  show:         { type: Boolean, required: true },
  currentEmail: { type: String, default: '' },
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
  <Transition name="modal">
    <div v-if="show" class="modal" @click.self="onClose">
      <div class="modal__panel">
        <div class="modal__header">
          <span class="modal__title">Changer d'adresse email</span>
          <button class="modal__close" @click="onClose">
            <AppIcon name="close" :width="18" :height="18" />
          </button>
        </div>

        <p class="modal__current">Actuel : <strong>{{ currentEmail }}</strong></p>

        <div class="modal__field">
          <label class="modal__label">Nouvel email</label>
          <input
            v-model="newEmail"
            class="modal__input"
            type="email"
            placeholder="nouveau@email.com"
            autocomplete="email"
          />
        </div>

        <p v-if="error" class="modal__error">{{ error }}</p>

        <p class="modal__hint">Un email de confirmation sera envoyé à la nouvelle adresse.</p>

        <AppButton variant="primary" @click="onSave">Envoyer la confirmation</AppButton>
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

  &__hint {
    @include title-sm;
    color: $muted;
  }
}

.modal-enter-active,
.modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
