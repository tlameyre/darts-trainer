<script setup>
defineProps({
  value: { type: Number, required: true },
})
</script>

<template>
  <span class="streak-badge">Série <span class="streak-badge__value">×{{ value }}</span></span>
</template>

<style lang="scss" scoped>
.streak-badge {
  @include title-md;
  display: flex;
  gap: $gap-xs;
  padding: $padding-xs $padding-sm;
  border-radius: $radius-sm;
  background: $black;
  color: $white;
  white-space: nowrap;

  &__value { color: color-mix(in srgb, var(--tone) 55%, white); }
}
</style>
