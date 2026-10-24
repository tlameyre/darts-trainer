<script setup>
defineProps({
  label:      { type: String, required: true },
  value:      { type: [String, Number], required: true },
  unit:       { type: String, default: null },
  badgeValue: { type: [String, Number], required: true },
  badgeLabel: { type: String, required: true },
  // [{ value, label }]
  metrics:    { type: Array, default: () => [] },
  color:      { type: String, required: true },
})
</script>

<template>
  <section class="stats-hero" :style="{ '--hero-color': color }">
    <div class="stats-hero__top">
      <div class="stats-hero__main">
        <span class="stats-hero__label">{{ label }}</span>
        <span class="stats-hero__value">
          {{ value }}<span v-if="unit" class="stats-hero__unit">{{ unit }}</span>
        </span>
      </div>
      <div class="stats-hero__badge">
        <span class="stats-hero__badge-value">{{ badgeValue }}</span>
        <span class="stats-hero__badge-label">{{ badgeLabel }}</span>
      </div>
    </div>

    <dl v-if="metrics.length" class="stats-hero__metrics">
      <div v-for="m in metrics" :key="m.label" class="stats-hero__metric">
        <dd class="stats-hero__metric-value">{{ m.value }}</dd>
        <dt class="stats-hero__metric-label">{{ m.label }}</dt>
      </div>
    </dl>

    <slot />
  </section>
</template>

<style lang="scss" scoped>
.stats-hero {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;
  padding: $padding-md;
  border-radius: $radius-sm;
  background: var(--hero-color);
  color: $white;

  &__top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__main {
    display: flex;
    flex-direction: column;
  }

  &__label {
    @include title-md;
  }

  &__value {
    @include display-md;
    line-height: 0.9;
  }

  &__unit {
    font-size: 0.5em;
  }

  &__badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $padding-xs $padding-sm;
    border-radius: $radius-sm;
    background: $white;
    color: var(--hero-color);
  }

  &__badge-value {
    @include title-xxxl;
    line-height: 1;
  }

  &__badge-label {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-sm;
    margin: 0;
    padding-top: $padding-sm;
    border-top: $border-md solid rgba($white, 0.3);
  }

  &__metric {
    display: flex;
    flex-direction: column;
  }

  &__metric-value {
    @include title-xxl;
    margin: 0;
    line-height: 1;
  }

  &__metric-label {
    @include text-xs;
    opacity: 0.8;
  }
}

@media (min-width: $bp-laptop) {
  .stats-hero {
    padding: $padding-xl;
    gap: $gap-md;

    &__label       { @include title-lg; }
    &__value       { @include display-lg; }
    &__badge-label { @include text-sm; }
    &__metrics     { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    &__metric-value { @include title-xxxl; }
    &__metric-label { @include text-sm; }
  }
}
</style>
