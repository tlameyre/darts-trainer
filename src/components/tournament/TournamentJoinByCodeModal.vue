<script setup>
import { ref, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'joined'])

const code    = ref('')
const loading = ref(false)
const error   = ref('')

watch(() => props.show, (show) => {
  if (show) { code.value = ''; error.value = '' }
})

defineExpose({ setError: (msg) => { error.value = msg; loading.value = false } })

function submit() {
  if (!code.value.trim() || loading.value) return
  loading.value = true
  error.value   = ''
  emit('joined', code.value.trim())
}
</script>

<template>
  <AppModal :show="show" title="Rejoindre un tournoi" size="sm" @close="$emit('close')">
    <div class="join-modal">
      <p class="join-modal__hint">Entre le code donné par l'organisateur, ou ouvre directement son lien d'invitation.</p>
      <label class="join-modal__field">
        <span class="join-modal__label">Code d'invitation</span>
        <input
          v-model="code"
          class="join-modal__input"
          :class="{ 'join-modal__input--error': error }"
          placeholder="T-4F9AB"
          maxlength="10"
          autocapitalize="characters"
          @keyup.enter="submit"
        />
      </label>
      <p v-if="error" class="join-modal__error">{{ error }}</p>
      <AppButton tone="tournament" :disabled="!code.trim() || loading" @click="submit">
        {{ loading ? 'Vérification...' : 'Rejoindre' }}
      </AppButton>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.join-modal {
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__hint {
    @include text-sm;
    color: $muted;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__label {
    @include text-sm;
    font-weight: 600;
    color: $muted;
  }

  &__input {
    height: 56px;
    background: $white;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;
    @include display-xs;
    text-align: center;
    letter-spacing: 0.06em;
    text-transform: uppercase;

    &:focus {
      outline: none;
      border-color: $mode-tournament;
    }

    &--error { border-color: $error; }
  }

  &__error {
    @include text-sm;
    color: $error;
    text-align: center;
  }
}
</style>
