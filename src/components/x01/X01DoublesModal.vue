<script setup>
import AppModal from '../AppModal.vue'
import AppIcon from '../AppIcon.vue'

defineProps({
  show: { type: Boolean, default: false },
})

defineEmits(['confirm'])
</script>

<template>
  <AppModal :show :z-index="110" size="lg" @close="$emit('confirm', 0)">
    <div class="db-modal__header">
      <p class="db-modal__title">Combien de doubles tentés ?</p>
      <button class="db-modal__close" @click="$emit('confirm', 0)">
        <AppIcon name="close" :width="16" :height="16" />
      </button>
    </div>
    <p class="db-modal__hint">Incluant les doubles manqués dans cette volée</p>
    <div class="db-modal__options">
      <button
        v-for="n in [0, 1, 2, 3]"
        :key="n"
        class="db-modal__btn"
        @click="$emit('confirm', n)"
      >
        {{ n }}
      </button>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.db-modal {
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
    @include title-sm;
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
    @include text-xxl;
    font-weight: 700;
    color: $white;
    transition: background 0.15s, transform 0.1s;

    &:active {
      background: $orange;
      transform: scale(0.96);
    }
  }
}

@media (min-width: $bp-laptop) {
  .db-modal {
    &__title { @include title-xl; }
    &__hint  { @include title-md; }
    &__btn   { @include text-xxl; padding: $padding-xl; }
  }
}
</style>
