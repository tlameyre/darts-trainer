<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  show: { type: Boolean, default: false },
})

defineEmits(['confirm'])

</script>

<template>
  <Transition name="sheet">
    <div v-if="show" class="doubles-modal">
      <div class="doubles-modal__backdrop" />
      <div class="doubles-modal__sheet">
        <div class="doubles-modal__header">
          <p class="doubles-modal__title">Combien de doubles tentés ?</p>
          <button class="doubles-modal__close" @click="$emit('confirm', 0)">
            <AppIcon name="close" :width="16" :height="16" />
          </button>
        </div>
        <p class="doubles-modal__hint">Incluant les doubles manqués dans cette volée</p>
        <div class="doubles-modal__options">
          <button
            v-for="n in [0, 1, 2, 3]"
            :key="n"
            class="doubles-modal__btn"
            @click="$emit('confirm', n)"
          >
            {{ n }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.doubles-modal {
  position: fixed;
  inset: 0;
  z-index: 110;
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
    max-width: 420px;
    margin: 0 auto;
    background: #1e2b28;
    border-radius: $radius-lg $radius-lg 0 0;
    padding: $padding-xl $padding-md calc($padding-xl + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    @include title-lg;
    color: $white;
  }

  &__close {
    color: $muted;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $padding-xxs;
    transition: color 0.15s;
    &:active { color: $white; }
  }

  &__hint {
    font-size: 13px;
    color: $muted;
    text-align: center;
    margin-top: -$gap-xs;
  }

  &__options {
    display: flex;
    gap: $gap-sm;
  }

  &__btn {
    flex: 1;
    background: rgba($white, 0.08);
    border-radius: $radius-md;
    padding: $padding-lg;
    font-family: $font-title;
    font-weight: 700;
    font-size: 32px;
    color: $white;
    transition: background 0.15s, transform 0.1s;

    &:active {
      background: $orange;
      transform: scale(0.96);
    }
  }
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s;

  .doubles-modal__sheet {
    transition: transform 0.25s ease;
  }
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;

  .doubles-modal__sheet {
    transform: translateY(100%);
  }
}
</style>
