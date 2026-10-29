<script setup>
import { ref, computed, watch } from 'vue'
import { canFinish } from '../../composables/useCheckoutAnalysis.js'
import AppButton from '../AppButton.vue'
import IconButton from '../IconButton.vue'
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  show:          { type: Boolean, required: true },
  winnerName:    { type: String,  default: null },
  defaultDarts:  { type: Number,  default: 3 },
  checkoutScore: { type: Number,  default: 0 },
})

const emit = defineEmits(['confirm'])

// Ex. 56 ne se finit pas en 1 fléchette (double-out) : minimum 2
const minDarts = computed(() => [1, 2, 3].find(n => canFinish(props.checkoutScore, n)) ?? 1)

const dartsToFinish = ref(Math.max(props.defaultDarts, minDarts.value))
const doublesThrown = ref(1)

watch(() => props.show, (val) => {
  if (val) {
    dartsToFinish.value = Math.max(props.defaultDarts, minDarts.value)
    doublesThrown.value = 1
  }
})

// Les minDarts − 1 premières fléchettes servent forcément à préparer le finish
const maxDoubles = computed(() => dartsToFinish.value - (minDarts.value - 1))

watch(maxDoubles, (val) => {
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
      <span class="co-modal__trophy"><AppIcon name="trophy" :width="24" :height="24" /></span>
      <div class="co-modal__heading">
        <span v-if="winnerName" class="co-modal__label">{{ winnerName }} remporte la manche</span>
        <p class="co-modal__title">Checkout {{ checkoutScore }} !</p>
      </div>
      <IconButton variant="bare" icon="close" :icon-size="22" label="Fermer" @click="confirm" />
    </div>

    <div class="co-modal__group">
      <p class="co-modal__label">Fléchettes pour finir</p>
      <div class="co-modal__options">
        <button
          v-for="n in [1, 2, 3]"
          :key="n"
          class="co-modal__btn"
          :class="{ 'co-modal__btn--active': dartsToFinish === n }"
          :aria-pressed="dartsToFinish === n"
          :disabled="n < minDarts"
          @click="dartsToFinish = n"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <div class="co-modal__group">
      <p class="co-modal__label">Dont tentées sur un double</p>
      <div class="co-modal__options">
        <button
          v-for="n in [1, 2, 3]"
          :key="n"
          class="co-modal__btn"
          :class="{ 'co-modal__btn--active': doublesThrown === n }"
          :aria-pressed="doublesThrown === n"
          :disabled="n > maxDoubles"
          @click="doublesThrown = n"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <AppButton size="md" tone="game" @click="confirm">Valider la manche</AppButton>
  </AppModal>
</template>

<style lang="scss" scoped>
.co-modal {
  &__header {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__trophy {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: var(--game-color, #{$accent});
    color: $white;
  }

  &__heading {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__title {
    @include title-xxl;
    line-height: 1.05;
  }


  &__group {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__label {
    @include text-xs;
    font-weight: 600;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: $tracking-lg;
  }

  &__options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__btn {
    height: 64px;
    border-radius: $radius-sm;
    border: $border-md solid $text-color;
    color: $text-color;
    @include title-xxxl;
    transition: transform 0.1s;

    &:active:not(:disabled) { transform: scale(0.96); }

    &--active {
      background: var(--game-color, #{$accent});
      border-color: var(--game-color, #{$accent});
      color: $white;
    }

    &:disabled { opacity: 0.2; cursor: default; }
  }
}

@media (min-width: $bp-laptop) {
  .co-modal {
    &__title   { @include title-xxxl; }
    &__label   { @include text-sm; }
    &__btn     { height: 80px; @include display-xs; }
  }
}
</style>
