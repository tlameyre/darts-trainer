<script setup>
defineProps({
  title: { type: String, default: '' },
  value: { type: [String, Number], required: true },
  // [{ label, value }] listed under the big value
  rows: { type: Array, default: () => [] },
  // Inactive cards sit translucent on the colored panel, the active one is a cream card
  active: { type: Boolean, default: true },
  // Rows only show on desktop
  compact: Boolean,
  // Single hero card: a bigger number on desktop
  large: Boolean,
})
</script>

<template>
  <div class="stat-card" :class="{ 'stat-card--ghost': !active, 'stat-card--large': large }">
    <div class="stat-card__header">
      <slot name="header">
        <span class="stat-card__title">{{ title }}</span>
        <slot name="badge" />
      </slot>
    </div>

    <span class="stat-card__value">{{ value }}</span>

    <div v-if="rows.length" class="stat-card__rows" :class="{ 'stat-card__rows--desktop-only': compact }">
      <span v-for="row in rows" :key="row.label" class="stat-card__row">
        <span class="stat-card__row-label">{{ row.label }}</span>
        <span class="stat-card__row-value">{{ row.value }}</span>
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stat-card {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  padding: $padding-sm;
  border-radius: $radius-sm;
  background: $bg;
  color: $text-color;
  transition: background 0.25s, color 0.25s;

  &--ghost {
    background: rgba($white, 0.14);
    color: $white;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-xs;
    min-width: 0;
  }

  &__title { @include title-md; }

  &__value {
    flex: 1;
    display: flex;
    align-items: center;
    @include display-sm;
    line-height: 0.85;
    font-variant-numeric: tabular-nums;
  }

  &--ghost &__value { opacity: 0.75; }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;

    &--desktop-only { display: none; }
  }

  &__row {
    display: flex;
    justify-content: space-between;
    @include text-xs;
  }

  &__row-label { color: $muted; }
  &--ghost &__row-label { color: rgba($white, 0.75); }

  &__row-value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
}

@media (min-width: $bp-laptop) {
  .stat-card {
    padding: $padding-xl;

    &__title { @include title-xxl; }
    &__value { @include display-xl; }
    &--large &__value { @include display-xxl; }
    &__rows--desktop-only { display: flex; }
    &__row { @include text-md; }
  }
}
</style>
