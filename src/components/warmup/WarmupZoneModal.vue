<script setup>
import { ref, watch } from 'vue'
import AppModal from '../AppModal.vue'
import ZonePicker from '../ZonePicker.vue'
import AppButton from '../AppButton.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  zone: { type: Object,  required: true },
})

const emit = defineEmits(['update:show', 'confirm'])

const tempZone = ref({ ...props.zone })

watch(() => props.show, (val) => {
  if (val) tempZone.value = { ...props.zone }
})
</script>

<template>
  <AppModal :show size="lg" centered @close="emit('update:show', false)">
    <div class="wz-modal__title">Changer de zone</div>
    <ZonePicker v-model="tempZone" />
    <div class="wz-modal__actions">
      <AppButton size="small" rounded="full" variant="secondary" @click="emit('update:show', false)">
        Annuler
      </AppButton>
      <AppButton size="small" rounded="full" @click="emit('confirm', tempZone)">
        Confirmer
      </AppButton>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.wz-modal {
  &__title {
    @include title-lg;
    color: $white;
    text-align: center;
  }

  &__actions {
    display: flex;
    gap: $gap-md;
    margin-top: $padding-xxs;

    :deep(.btn) { flex: 1; }
  }
}

@media (min-width: $bp-laptop) {
  .wz-modal__title { @include title-xl; }
}
</style>
