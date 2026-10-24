<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  tone: { type: String, default: 'orange', validator: v => ['orange', 'blue', 'green', 'cyan', 'red'].includes(v) },
})
</script>

<template>
  <button class="start-btn" :class="`start-btn--${tone}`">
    <slot>Commencer</slot>
    <AppIcon name="arrow-right" :width="20" :height="20" />
  </button>
</template>

<style lang="scss" scoped>
.start-btn {
  @include title-xl;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $gap-xs;
  height: 56px;
  flex-shrink: 0;
  border-radius: $radius-sm;
  color: $white;
  transition: background 0.15s;

  &--orange {
    background: $orange;
    &:active { background: $orange-dark; }
  }

  &--blue {
    background: $blue;
    &:active { background: $blue-dark; }
  }

  &--green {
    background: $accent;
    &:active { background: $black; }
  }

  &--cyan {
    background: $mode-checkout;
    &:active { background: $black; }
  }

  &--red {
    background: $mode-tactics;
    &:active { background: $black; }
  }
}

@media (min-width: $bp-laptop) {
  .start-btn {
    @include title-xxl;
    height: 64px;
  }
}
</style>
