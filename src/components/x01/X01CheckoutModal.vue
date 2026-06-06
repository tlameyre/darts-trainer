<script setup>
import { ref, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  show:          { type: Boolean, required: true },
  defaultDarts:  { type: Number,  default: 3 },
  checkoutScore: { type: Number,  default: 0 },
})

const emit = defineEmits(['confirm'])

const dartsToFinish = ref(props.defaultDarts)
const doublesThrown = ref(1)

watch(() => props.show, (val) => {
  if (val) {
    dartsToFinish.value = props.defaultDarts
    doublesThrown.value = 1
  }
})

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
  <AppModal :show :z-index="110" size="lg" @close="confirm">
    <div class="co-modal__header">
      <span class="co-modal__trophy">🏆</span>
      <p class="co-modal__title">Checkout {{ checkoutScore }} !</p>
      <button class="co-modal__close" @click="confirm">
        <AppIcon name="close" :width="16" :height="16" />
      </button>
    </div>

    <div class="co-modal__group">
      <p class="co-modal__label">Fléchettes pour finir</p>
      <div class="co-modal__options">
        <button
          v-for="n in [1, 2, 3]"
          :key="n"
          class="co-modal__btn"
          :class="{ 'co-modal__btn--active': dartsToFinish === n }"
          @click="dartsToFinish = n"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <div class="co-modal__group">
      <p class="co-modal__label">Dont sur un double</p>
      <div class="co-modal__options">
        <button
          v-for="n in [1, 2, 3]"
          :key="n"
          class="co-modal__btn"
          :class="{
            'co-modal__btn--active':   doublesThrown === n,
            'co-modal__btn--disabled': n > dartsToFinish,
          }"
          :disabled="n > dartsToFinish"
          @click="doublesThrown = n"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <button class="co-modal__confirm" @click="confirm">Confirmer</button>
  </AppModal>
</template>

<style lang="scss" scoped>
.co-modal {
  &__header {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__trophy { @include title-xxl; line-height: 1; flex-shrink: 0; }

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
    @include title-xxl;
    font-weight: 700;
    color: $white;
    transition: background 0.12s, transform 0.1s;

    &:active:not(:disabled) { transform: scale(0.96); }
    &--active   { background: $orange; }
    &--disabled { opacity: 0.2; cursor: default; }
  }

  &__confirm {
    background: $orange;
    border-radius: $radius-sm;
    padding: $padding-md;
    @include title-md;
    font-weight: 700;
    text-transform: uppercase;
    color: $white;
    transition: opacity 0.15s;

    &:active { opacity: 0.8; }
  }
}

@media (min-width: $bp-laptop) {
  .co-modal {
    &__title   { @include title-xxl; }
    &__label   { @include title-md; }
    &__btn     { @include display-xs; padding: $padding-lg; }
    &__confirm { @include title-lg; padding: $padding-lg; }
  }
}
</style>
