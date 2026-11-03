<script setup>
import SectionTitle from '../SectionTitle.vue'

defineProps({
  count:     { type: Number, required: true },
  unit:      { type: String, required: true },
  emptyText: { type: String, required: true },
})
</script>

<template>
  <section v-if="count" class="stats-history">
    <SectionTitle title="Historique" :count="`${count} ${unit}`" ruled />
    <ul class="stats-history__list">
      <slot />
    </ul>
  </section>

  <p v-else class="stats-history__empty">{{ emptyText }}</p>
</template>

<style lang="scss" scoped>
.stats-history {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: $gap-xs;

  &__list {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $gap-xs;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow-y: auto;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }
}

@media (min-width: $bp-laptop) {
  .stats-history {
    gap: $gap-sm;

    &__list  { gap: $gap-sm; }
    &__empty { @include text-md; }
  }
}
</style>
