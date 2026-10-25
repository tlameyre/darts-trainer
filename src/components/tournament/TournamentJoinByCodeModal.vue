<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'

const CODE_LENGTH = 5

const props = defineProps({
  show: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'joined'])

const chars   = ref('')
const loading = ref(false)
const error   = ref('')
const inputEl = ref(null)

watch(() => props.show, (show) => {
  if (!show) return
  chars.value = ''
  error.value = ''
  nextTick(() => inputEl.value?.focus())
})

defineExpose({ setError: (msg) => { error.value = msg; loading.value = false } })

// Accepts the bare characters or a pasted "T-4F9AB"
function onInput(e) {
  const clean = e.target.value.toUpperCase().replace(/^T-?/, '').replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
  chars.value = clean
  e.target.value = clean
  error.value = ''
}

const cells    = computed(() => Array.from({ length: CODE_LENGTH }, (_, i) => chars.value[i] ?? ''))
const complete = computed(() => chars.value.length === CODE_LENGTH)

function submit() {
  if (!complete.value || loading.value) return
  loading.value = true
  error.value   = ''
  emit('joined', `T-${chars.value}`)
}
</script>

<template>
  <AppModal :show="show" title="Rejoindre un tournoi" size="sm" centered width="560px" @close="$emit('close')">
    <div class="join-modal">
      <p class="join-modal__hint">Entre le code donné par l'organisateur, ou ouvre directement son lien d'invitation.</p>

      <label class="join-modal__field">
        <span class="join-modal__label">Code d'invitation</span>
        <span class="join-modal__code">
          <span class="join-modal__prefix">T-</span>
          <span
            v-for="(c, i) in cells" :key="i"
            class="join-modal__cell"
            :class="{ 'join-modal__cell--active': i === Math.min(chars.length, CODE_LENGTH - 1) && !error, 'join-modal__cell--error': error }"
          >{{ c }}</span>
          <input
            ref="inputEl"
            class="join-modal__input"
            :value="chars"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            aria-label="Code d'invitation"
            @input="onInput"
            @keyup.enter="submit"
          />
        </span>
      </label>

      <p v-if="error" class="join-modal__error">{{ error }}</p>
      <AppButton tone="tournament" :disabled="!complete || loading" @click="submit">
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

  &__code {
    position: relative;
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    cursor: text;
  }

  &__prefix {
    @include title-xl;
    color: $muted;
    padding-right: 2px;
  }

  &__cell {
    flex: 1;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $white;
    @include title-xl;

    &--active { border-color: $black; }
    &--error  { border-color: $error; }
  }

  // Real field, stretched over the cells so taps, paste and the keyboard all reach it
  &__input {
    position: absolute;
    inset: 0;
    width: 100%;
    opacity: 0;
    cursor: text;
  }

  &__error {
    @include text-sm;
    color: $error;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .join-modal {
    gap: $gap-lg;

    &__hint { @include text-md; }
    &__label { @include text-md; }
    &__prefix { @include title-xxl; }
    &__cell { height: 64px; @include title-xxl; }
    &__error { @include text-md; }
  }
}
</style>
