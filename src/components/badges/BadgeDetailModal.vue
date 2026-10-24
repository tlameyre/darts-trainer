<script setup>
import { computed } from 'vue'
import { BADGE_CATEGORIES } from '../../data/badges.js'
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'
import BadgeIcon from './BadgeIcon.vue'

const props = defineProps({
  show:     { type: Boolean, required: true },
  badge:    { type: Object,  default: null },
  progress: { type: Object,  default: null },
})

defineEmits(['close'])

const categoryColor = computed(() => BADGE_CATEGORIES.find(c => c.name === props.badge?.category)?.color)

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function pct(progress) {
  if (!progress) return 0
  return Math.min(Math.round((progress.current / progress.target) * 100), 100)
}
</script>

<template>
  <AppModal :show="show && !!badge" size="lg" centered width="520px" @close="$emit('close')">
    <template v-if="badge">
      <button class="app-modal__close bd-modal__close" aria-label="Fermer" @click="$emit('close')">
        <AppIcon name="close" :width="16" :height="16" />
      </button>

      <div class="bd-modal__head">
        <BadgeIcon :badge="badge" :locked="!badge.unlockedAt" class="bd-modal__icon" />
        <div class="bd-modal__titles">
          <span class="bd-modal__category">
            <span class="bd-modal__category-dot" :style="{ background: categoryColor }" />
            {{ badge.category }}
          </span>
          <h2 class="bd-modal__label">{{ badge.label }}</h2>
        </div>
      </div>

      <p class="bd-modal__desc">{{ badge.description }}</p>

      <div v-if="badge.unlockedAt" class="bd-modal__unlocked">
        <AppIcon name="check" :width="18" :height="18" />
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
          <div class="bd-modal__progress-fill" :style="{ width: pct(progress) + '%', background: categoryColor }" />
        </div>
      </div>

      <div v-else class="bd-modal__locked">
        <AppIcon name="lock" :width="16" :height="16" />
        À débloquer
      </div>
    </template>
  </AppModal>
</template>

<style lang="scss" scoped>
.bd-modal {
  &__close { align-self: flex-end; margin-bottom: -$gap-md; }

  &__head {
    display: flex;
    align-items: center;
    gap: $gap-md;
  }

  &__icon { --badge-icon-size: 80px; }

  &__titles {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    min-width: 0;
  }

  &__category {
    @include text-xs;
    display: inline-flex;
    align-self: flex-start;
    align-items: center;
    gap: $gap-xs;
    padding: 3px $padding-xs;
    border-radius: $radius-sm;
    background: $surface;
    font-weight: 600;
    letter-spacing: $tracking-sm;
    text-transform: uppercase;
    color: $muted;
  }

  &__category-dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-xs;
  }

  &__label {
    @include title-xxxl;
    line-height: 0.9;
    overflow-wrap: anywhere;
  }

  &__desc {
    @include text-md;
    line-height: 1.45;
  }

  &__unlocked {
    @include text-sm;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $accent;
    color: $white;
    font-weight: 600;
  }

  &__locked {
    @include text-sm;
    display: flex;
    align-items: center;
    gap: $gap-xs;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
    color: $muted;
    font-weight: 600;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-sm;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__progress-header {
    @include text-sm;
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    color: $muted;
  }

  &__progress-values { color: $text-color; }

  &__progress-bar {
    height: 8px;
    border-radius: $radius-xs;
    background: $border-color;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    transition: width 0.4s ease;
  }
}

@media (min-width: $bp-laptop) {
  .bd-modal {
    &__icon { --badge-icon-size: 96px; }
    &__desc { @include text-lg; }
    &__unlocked, &__locked, &__progress-header { @include text-md; }
  }
}
</style>
