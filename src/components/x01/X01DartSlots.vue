<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({
  darts: { type: Array, required: true },   // fléchettes actuelles (0-3)
  volleyNumber: { type: Number, required: true },
  bust: { type: Boolean, default: false },
})
</script>

<template>
  <div class="slots">
    <div class="slots__tour-row">
      <span class="slots__tour-label">TOUR {{ volleyNumber }}</span>
    </div>

    <div class="slots__bar" :class="{ 'slots__bar--bust': bust }">
      <div class="slots__icon">
        <AppIcon name="dartboard" :width="30" :height="30" />
      </div>

      <template v-if="!bust">
        <div v-for="i in 3" :key="i" class="slots__slot">
          <Transition name="slot-pop">
            <span v-if="darts[i - 1]" :key="darts[i - 1].label + i" class="slots__dart">
              {{ darts[i - 1].label }}
            </span>
          </Transition>
        </div>
      </template>

      <template v-else>
        <div class="slots__bust-label">BUST !</div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.slots {
  flex-shrink: 0;

  &__tour-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $gap-xs;
  }

  &__tour-label {
    @include title-md;
  }

  &__bar {
    display: flex;
    align-items: stretch;
    background: $white;
    border-radius: $radius-pill;
    overflow: hidden;
    padding: $padding-sm;
    transition: background 0.2s;

    &--bust {
      background: $error;
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: $padding-md;
    color: $black;
    flex-shrink: 0;
  }

  &__slot {
    color: $black;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: $border-md solid $black;
    overflow: hidden;
    min-height: 36px;
  }

  &__dart {
    @include title-xl;
    font-variant-numeric: tabular-nums;
  }

  &__bust-label {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: $font-title;
    font-weight: 700;
    font-size: 22px;
    color: $white;
    border-left: $border-md solid rgba($white, 0.4);
    letter-spacing: 0.08em;
  }
}

.slot-pop-enter-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.slot-pop-enter-from {
  transform: scale(0.5);
  opacity: 0;
}
</style>
