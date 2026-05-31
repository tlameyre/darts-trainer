<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show:          { type: Boolean, required: true },
  defaultDarts:  { type: Number,  default: 3 },   // pré-rempli depuis le tracking
  checkoutScore: { type: Number,  default: 0 },
})

const emit = defineEmits(['confirm'])

const dartsToFinish  = ref(props.defaultDarts)
const doublesThrown  = ref(1)

// Quand la modale s'ouvre → reset avec les valeurs par défaut
watch(() => props.show, (val) => {
  if (val) {
    dartsToFinish.value = props.defaultDarts
    doublesThrown.value = 1
  }
})

// Contrainte : doublesThrown ≤ dartsToFinish
watch(dartsToFinish, (val) => {
  if (doublesThrown.value > val) doublesThrown.value = val
})

function confirm() {
  emit('confirm', {
    dartsToFinish: dartsToFinish.value,
    doublesThrown:  doublesThrown.value,
  })
}
</script>

<template>
  <Transition name="sheet">
    <div v-if="show" class="checkout-modal">
      <div class="checkout-modal__backdrop" />
      <div class="checkout-modal__sheet">

        <div class="checkout-modal__header">
          <span class="checkout-modal__trophy">🏆</span>
          <p class="checkout-modal__title">Checkout {{ checkoutScore }} !</p>
          <button class="checkout-modal__close" @click="confirm">
            <AppIcon name="close" :width="16" :height="16" />
          </button>
        </div>

        <!-- Fléchettes pour finir -->
        <div class="checkout-modal__group">
          <p class="checkout-modal__label">Fléchettes pour finir</p>
          <div class="checkout-modal__options">
            <button
              v-for="n in [1, 2, 3]"
              :key="n"
              class="checkout-modal__btn"
              :class="{ 'checkout-modal__btn--active': dartsToFinish === n }"
              @click="dartsToFinish = n"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <!-- Dont sur un double -->
        <div class="checkout-modal__group">
          <p class="checkout-modal__label">Dont sur un double</p>
          <div class="checkout-modal__options">
            <button
              v-for="n in [1, 2, 3]"
              :key="n"
              class="checkout-modal__btn"
              :class="{
                'checkout-modal__btn--active':   doublesThrown === n,
                'checkout-modal__btn--disabled': n > dartsToFinish,
              }"
              :disabled="n > dartsToFinish"
              @click="doublesThrown = n"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <button class="checkout-modal__confirm" @click="confirm">
          Confirmer
        </button>

      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.checkout-modal {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: flex-end;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba($black, 0.65);
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
    gap: $gap-lg;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__trophy { font-size: 28px; line-height: 1; flex-shrink: 0; }

  &__title {
    @include title-xl;
    color: $white;
    flex: 1;
  }

  &__close {
    color: $muted;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $padding-xxs;
    flex-shrink: 0;
    transition: color 0.15s;
    &:active { color: $white; }
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__label {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__options {
    display: flex;
    gap: $gap-sm;
  }

  &__btn {
    flex: 1;
    background: rgba($white, 0.07);
    border-radius: $radius-md;
    padding: $padding-md;
    font-family: $font-title;
    font-weight: 700;
    font-size: 28px;
    color: $white;
    transition: background 0.12s, transform 0.1s;

    &:active:not(:disabled) {
      transform: scale(0.96);
    }

    &--active {
      background: $orange;
    }

    &--disabled {
      opacity: 0.2;
      cursor: default;
    }
  }

  &__confirm {
    background: $orange;
    border-radius: $radius-sm;
    padding: $padding-md;
    font-family: $font-title;
    font-weight: 700;
    font-size: $title-md;
    text-transform: uppercase;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }
  }
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s;
  .checkout-modal__sheet { transition: transform 0.25s ease; }
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  .checkout-modal__sheet { transform: translateY(100%); }
}
</style>
