<script setup>
defineProps({
  title: { type: String, required: true },
  date:  { type: String, required: true },
  color: { type: String, required: true },
  // [{ label, value }]
  metrics: { type: Array, default: () => [] },
})

defineEmits(['click'])
</script>

<template>
  <li class="history-card" :style="{ '--card-color': color }" @click="$emit('click')">
    <div class="history-card__header">
      <span class="history-card__title">{{ title }}</span>
      <span class="history-card__date">{{ date }}</span>
    </div>
    <div v-if="metrics.length" class="history-card__metrics">
      <span v-for="m in metrics" :key="m.label" class="history-card__metric">
        {{ m.label }}<strong class="history-card__metric-value">{{ m.value }}</strong>
      </span>
    </div>
    <slot />
  </li>
</template>

<style lang="scss" scoped>
.history-card {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;
  padding: $padding-sm;
  border-radius: $radius-sm;
  border-left: 4px solid var(--card-color);
  background: $surface;
  cursor: pointer;
  list-style: none;
  transition: opacity 0.15s;

  &:active { opacity: 0.6; }

  &__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $gap-sm;
  }

  &__title {
    @include title-lg;
    line-height: 1;
  }

  &__date {
    @include text-xs;
    color: $muted;
  }

  &__metrics {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xxs $gap-md;
  }

  &__metric {
    display: flex;
    align-items: baseline;
    gap: $gap-xxs;
    @include text-sm;
    color: $muted;
  }

  &__metric-value {
    @include title-md;
    color: $text-color;
  }
}

@media (min-width: $bp-laptop) {
  .history-card {
    padding: $padding-md;

    &__title { @include title-xl; }
    &__date  { @include text-sm; }
    &__metric { @include text-md; }
    &__metric-value { @include title-lg; }
  }
}
</style>
