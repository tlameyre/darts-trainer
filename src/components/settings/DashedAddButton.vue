<script setup>
import AppIcon from '../AppIcon.vue'
</script>

<template>
  <button class="add-btn">
    <AppIcon name="plus" :width="16" :height="16" /><slot />
  </button>
</template>

<style lang="scss" scoped>
.add-btn {
  @include title-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $gap-xs;
  height: 44px;
  border: $border-md dashed $border-color;
  border-radius: $radius-sm;
  color: $text-color;

  &:active { border-color: var(--tone); }
}

@media (min-width: $bp-laptop) {
  .add-btn {
    @include title-md;
    height: 56px;
  }
}
</style>
