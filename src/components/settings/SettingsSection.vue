<script setup>
defineProps({
  label: String,
  hint: String,
})
</script>

<template>
  <section class="settings-section">
    <div v-if="label" class="settings-section__head">
      <h2 class="settings-section__label">{{ label }}</h2>
      <span v-if="hint" class="settings-section__hint">{{ hint }}</span>
    </div>
    <slot />
  </section>
</template>

<style lang="scss" scoped>
.settings-section {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__label {
    @include title-sm;
    color: $muted;
  }

  &__hint {
    @include text-xs;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .settings-section {
    gap: $gap-sm;

    &__label { @include title-md; }
    &__hint { @include text-sm; }
  }
}
</style>
