<script setup>
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  show:     { type: Boolean, required: true },
  badge:    { type: Object, default: null },   // { id, label, description, icon, unlockedAt? }
  progress: { type: Object, default: null },   // { current, target, suffix } ou null
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
  <Transition name="modal">
    <div v-if="show && badge" class="badge-modal" @click.self="$emit('close')">
      <div class="badge-modal__panel">

        <button class="badge-modal__close" @click="$emit('close')">
          <AppIcon name="stop" :width="18" :height="18" />
        </button>

        <div class="badge-modal__icon" :class="{ 'badge-modal__icon--locked': !badge.unlockedAt }">
          {{ badge.icon }}
        </div>

        <h2 class="badge-modal__label">{{ badge.label }}</h2>
        <p class="badge-modal__desc">{{ badge.description }}</p>

        <!-- Débloqué -->
        <div v-if="badge.unlockedAt" class="badge-modal__unlocked">
          <AppIcon name="check" :width="14" :height="14" />
          Débloqué le {{ formatDate(badge.unlockedAt) }}
        </div>

        <!-- Verrouillé avec progression -->
        <div v-else-if="progress" class="badge-modal__progress">
          <div class="badge-modal__progress-header">
            <span>Progression</span>
            <span class="badge-modal__progress-values">
              {{ progress.current }}{{ progress.suffix }} / {{ progress.target }}{{ progress.suffix }}
            </span>
          </div>
          <div class="badge-modal__progress-bar">
            <div
              class="badge-modal__progress-fill"
              :style="{ width: pct(progress) + '%' }"
            />
          </div>
        </div>

        <!-- Verrouillé binaire -->
        <div v-else class="badge-modal__locked">
          Non débloqué
        </div>

      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.badge-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  z-index: 100;

  &__panel {
    position: relative;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    background: #1e2a26;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: $padding-xl $padding-md $padding-xxl;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
    text-align: center;
  }

  &__close {
    position: absolute;
    top: $padding-md;
    right: $padding-md;
    color: $muted;
    display: flex;
    &:active { color: $text-color; }
  }

  &__icon {
    font-size: 64px;
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
    @include text-sm;
    color: $muted;
    font-size: 13px;
  }

  &__progress-values {
    color: $text-color;
  }

  &__progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
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

.modal-enter-active,
.modal-leave-active { transition: opacity 0.2s; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
