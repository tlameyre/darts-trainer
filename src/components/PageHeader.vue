<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <header class="page-header">
    <h1 class="page-header__title">{{ title }}</h1>
    <slot />
  </header>
</template>

<style lang="scss" scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $gap-sm;
  padding: calc(#{$padding-xxl} + env(safe-area-inset-top)) $padding-md $padding-md;
  background: $black;
  color: $bg;

  &__title {
    @include title-xxxl;
    line-height: 0.9;
  }
}

@media (min-width: $bp-laptop) {
  .page-header {
    padding: calc(#{$padding-xxl} + env(safe-area-inset-top)) $padding-xxl $padding-xl;

    &__title { @include display-xs; }
  }
}
</style>
