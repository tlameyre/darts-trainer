<script setup>
defineProps({
  value:    { type: [String, Number], required: true },
  label:    { type: String, required: true },
  highlight: { type: Boolean, default: false },
})
</script>

<template>
  <div class="stat-cell" :class="{ 'stat-cell--highlight': highlight }">
    <span class="stat-cell__value">{{ value }}</span>
    <span class="stat-cell__label">{{ label }}</span>
  </div>
</template>

<style lang="scss" scoped>
.stat-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $gap-xxs;
  background: rgba($white, 0.04);
  border-radius: $radius-md;
  padding: $padding-sm $padding-xs;

  &--highlight {
    background: rgba(#047857, 0.15);
    border: 1px solid rgba(#047857, 0.3);
  }

  &__value {
    @include title-xl;
    color: $text-color;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  &__label {
    @include title-xs;
    color: $muted;
    text-align: center;
    line-height: 1.3;
  }
}

@media (min-width: $bp-laptop) {
  .stat-cell {
    padding: $padding-md $padding-sm;

    &__value { @include title-xxl; }
    &__label { @include title-sm; }
  }
}
</style>
