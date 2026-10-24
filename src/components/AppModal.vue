<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, default: '' },
  zIndex: { type: Number, default: 100 },
  size: { type: String, default: 'sm' }, // 'sm' | 'lg'
  centered: { type: Boolean, default: false },
  minHeight: { type: String, default: null },
  width:     { type: String, default: null }, // desktop dialog width (centered only)
})

defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="app-sheet">
      <div v-if="show" class="app-modal" :class="{ 'app-modal--centered': centered }" :style="{ zIndex }">
        <div class="app-modal__backdrop" @click="$emit('close')" />
        <div class="app-modal__sheet" :class="`app-modal__sheet--${size}`" :style="{ minHeight: minHeight ?? undefined, '--modal-width': width ?? undefined }">
          <span class="app-modal__handle" />
          <div v-if="title" class="app-modal__header">
            <h2 class="app-modal__title">{{ title }}</h2>
            <button class="app-modal__close" aria-label="Fermer" @click="$emit('close')">
              <AppIcon name="close" :width="16" :height="16" />
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss">
.app-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba($black, 0.6);
  }

  &__sheet {
    position: relative;
    width: 100%;
    margin: 0 auto;
    background: $bg;
    color: $text-color;
    border-radius: $radius-lg $radius-lg 0 0;
    display: flex;
    flex-direction: column;
    max-height: 90dvh;
    overflow-y: auto;

    &--sm {
      padding: $padding-sm $padding-md $padding-xxl;
      gap: $gap-md;

      @media (min-width: $bp-laptop) {
        padding: $padding-sm $padding-xl $padding-xxl;
        gap: $gap-lg;
      }
    }

    &--lg {
      padding: $padding-sm $padding-md calc(#{$padding-xl} + env(safe-area-inset-bottom, 0px));
      gap: $gap-lg;

      @media (min-width: $bp-laptop) {
        padding: $padding-sm $padding-xl calc(#{$padding-xxl} + env(safe-area-inset-bottom, 0px));
        gap: $gap-xl;
      }
    }
  }

  &__handle {
    align-self: center;
    flex-shrink: 0;
    width: 40px;
    height: 4px;
    border-radius: $radius-pill;
    background: $border-color;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
    position: sticky;
    top: 0;
    background: $bg;
    z-index: 1;
  }

  &__title {
    @include title-xxl;
    line-height: 1;
  }

  &__close {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;

    &:active { background: $border-color; }
  }
}

// Desktop: a centered dialog instead of a bottom sheet
@media (min-width: $bp-laptop) {
  .app-modal--centered {
    align-items: center;
    justify-content: center;

    .app-modal__sheet {
      width: var(--modal-width, 560px);
      padding-top: $padding-xl;
      border-radius: $radius-lg;
    }

    .app-modal__handle { display: none; }
    .app-modal__title { @include title-xxxl; line-height: 1; }

    .app-modal__close {
      width: 44px;
      height: 44px;
    }
  }
}

.app-sheet-enter-active,
.app-sheet-leave-active {
  transition: opacity 0.25s;

  .app-modal__sheet {
    transition: transform 0.25s ease;
  }
}

.app-sheet-enter-from,
.app-sheet-leave-to {
  opacity: 0;

  .app-modal__sheet {
    transform: translateY(100%);
  }
}

@media (min-width: $bp-laptop) {
  .app-sheet-enter-from.app-modal--centered,
  .app-sheet-leave-to.app-modal--centered {
    .app-modal__sheet { transform: translateY(16px); }
  }
}
</style>
