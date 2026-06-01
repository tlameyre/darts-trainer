<script setup>
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  show:     { type: Boolean, required: true },
  badge:    { type: Object,  default: null },
  progress: { type: Object,  default: null },
})

defineEmits(['close'])

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function pct(progress) {
  if (!progress) return 0
  return Math.min(Math.round((progress.current / progress.target) * 100), 100)
}
</script>

<template>
  <AppModal :show="show && !!badge" size="lg" @close="$emit('close')">
    <button class="bd-modal__close" @click="$emit('close')">
      <AppIcon name="close" :width="24" :height="24" />
    </button>

    <div class="bd-modal__icon" :class="{ 'bd-modal__icon--locked': !badge?.unlockedAt }">
      {{ badge?.icon }}
    </div>

    <h2 class="bd-modal__label">{{ badge?.label }}</h2>
    <p class="bd-modal__desc">{{ badge?.description }}</p>

    <div v-if="badge?.unlockedAt" class="bd-modal__unlocked">
      <AppIcon name="check" :width="14" :height="14" />
      Débloqué le {{ formatDate(badge.unlockedAt) }}
    </div>

    <div v-else-if="progress" class="bd-modal__progress">
      <div class="bd-modal__progress-header">
        <span>Progression</span>
        <span class="bd-modal__progress-values">
          {{ progress.current }}{{ progress.suffix }} / {{ progress.target }}{{ progress.suffix }}
        </span>
      </div>
      <div class="bd-modal__progress-bar">
        <div class="bd-modal__progress-fill" :style="{ width: pct(progress) + '%' }" />
      </div>
    </div>

    <div v-else class="bd-modal__locked">
      Non débloqué
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.bd-modal {
  &__close {
    position: absolute;
    top: $padding-md;
    right: $padding-md;
    color: $muted;
    display: flex;
    &:active { color: $text-color; }
  }

  &__icon {
    @include display-md;
    line-height: 1;
    margin-bottom: $gap-xs;

    &--locked {
      filter: grayscale(1);
      opacity: 0.4;
    }
  }

  &__label {
    @include title-xl;
    color: $text-color;
  }

  &__desc {
    @include text-sm;
    color: $muted;
    line-height: 1.5;
  }

  &__unlocked {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include text-sm;
    color: $accent;
    margin-top: $gap-xs;
  }

  &__locked {
    @include text-sm;
    color: $muted;
    margin-top: $gap-xs;
  }

  &__progress {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    margin-top: $gap-xs;
  }

  &__progress-header {
    display: flex;
    justify-content: space-between;
    @include title-sm;
    color: $muted;
  }

  &__progress-values { color: $text-color; }

  &__progress-bar {
    height: 6px;
    background: rgba($white, 0.1);
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: $orange;
    border-radius: $radius-pill;
    transition: width 0.4s ease;
  }
}

// Override sheet layout for centered badge content
:deep(.app-modal__sheet) {
  align-items: center;
  text-align: center;
  padding-top: $padding-xxl;
}

@media (min-width: $bp-laptop) {
  :deep(.app-modal__sheet) {
    padding: $padding-xxl;
    align-items: center;
    justify-content: center;
    min-height: 50%;
  }

  .bd-modal__icon { @include display-lg; }
  .bd-modal__label { @include title-xxl; }
  .bd-modal__desc { @include text-lg; }
  .bd-modal__unlocked { @include text-lg; }
  .bd-modal__locked { @include text-lg; }
  .bd-modal__progress { gap: $gap-md; }
  .bd-modal__progress-header { @include title-xl; }
  .bd-modal__progress-bar { height: 12px; }
}
</style>
