<script setup>
import { ref, watch } from 'vue'
import AppIcon from '../AppIcon.vue'
import AppButton from '../AppButton.vue'

const props = defineProps({
  show:      { type: Boolean, required: true },
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  username:  { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])

const localFirstName = ref('')
const localLastName  = ref('')
const localUsername  = ref('')

watch(() => props.show, (val) => {
  if (val) {
    localFirstName.value = props.firstName
    localLastName.value  = props.lastName
    localUsername.value  = props.username
  }
})

function onSave() {
  emit('save', {
    first_name: localFirstName.value.trim(),
    last_name:  localLastName.value.trim(),
    username:   localUsername.value.trim(),
  })
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="edit-modal" @click.self="$emit('close')">
      <div class="edit-modal__panel">
        <div class="edit-modal__header">
          <span class="edit-modal__title">Modifier le profil</span>
          <button class="edit-modal__close" @click="$emit('close')">
            <AppIcon name="stop" :width="18" :height="18" />
          </button>
        </div>

        <div class="edit-modal__field">
          <label class="edit-modal__label">Prénom</label>
          <input v-model="localFirstName" class="edit-modal__input" type="text" placeholder="Ton prénom" autocomplete="given-name" />
        </div>

        <div class="edit-modal__field">
          <label class="edit-modal__label">Nom</label>
          <input v-model="localLastName" class="edit-modal__input" type="text" placeholder="Ton nom" autocomplete="family-name" />
        </div>

        <div class="edit-modal__field">
          <label class="edit-modal__label">Surnom</label>
          <input v-model="localUsername" class="edit-modal__input" type="text" placeholder="Ton surnom" autocomplete="nickname" />
        </div>

        <AppButton variant="primary" @click="onSave">Sauvegarder</AppButton>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.edit-modal {
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
    transition: color 0.15s;
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
}

.modal-enter-active,
.modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
