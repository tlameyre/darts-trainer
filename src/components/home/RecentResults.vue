<script setup>
import AppIcon from '../AppIcon.vue'
import SectionTitle from '../SectionTitle.vue'

defineProps({
  // [{ id, color, icon, title, sub, badge }] — see utils/recentResults.js
  results: { type: Array, required: true },
})

defineEmits(['history'])
</script>

<template>
  <section v-if="results.length" class="recent-results">
    <SectionTitle title="Derniers résultats" action="Historique" @action="$emit('history')" />
    <ul class="recent-results__list">
      <li v-for="r in results" :key="r.id" class="recent-results__row">
        <span class="recent-results__icon" :style="{ background: r.color }">
          <AppIcon :name="r.icon" :width="22" :height="22" />
        </span>
        <span class="recent-results__body">
          <span class="recent-results__title">{{ r.title }}</span>
          <span class="recent-results__sub">{{ r.sub }}</span>
        </span>
        <span class="recent-results__badge">{{ r.badge }}</span>
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.recent-results {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xs;
    border-radius: $radius-sm;
    background: $surface;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: $radius-sm;
    color: $white;
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    @include title-lg;
    line-height: 1;
  }

  &__sub {
    @include text-xs;
    color: $muted;
  }

  &__badge {
    padding: $padding-xxs $padding-xs;
    border-radius: $radius-sm;
    background: $border-color;
    @include title-sm;
  }
}

@media (min-width: $bp-laptop) {
  .recent-results {
    gap: $gap-sm;

    &__row { padding: $padding-sm; }
    &__title { @include title-xl; }
    &__sub { @include text-sm; }
    &__badge { @include title-md; }
  }
}
</style>
