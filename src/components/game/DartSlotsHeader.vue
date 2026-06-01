<script setup>
defineProps({
  tourNumber: { type: Number, required: true },
})
</script>

<template>
  <div class="dart-header">
    <span class="dart-header__label">TOUR {{ tourNumber }}</span>
    <slot name="right" />
  </div>
</template>

<style lang="scss" scoped>
.dart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  &__label {
    @include title-md;
  }
}

@media (min-width: $bp-laptop) {
  .dart-header__label { @include title-lg; }
}
</style>