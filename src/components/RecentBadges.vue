<script setup>
import { BADGES } from '../data/badges.js'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  badges:    { type: Array,  required: true },
  emptyText: { type: String, default: 'Aucun badge encore — commence à jouer !' },
})

defineEmits(['badge-click', 'view-all'])
</script>

<template>
  <section class="recent-badges">
    <div class="recent-badges__header">
      <h2 class="recent-badges__title">
        Badges <span class="recent-badges__count">{{ badges.length }}/{{ BADGES.length }}</span>
      </h2>
      <button class="recent-badges__more" @click="$emit('view-all')">
        Voir tout
      </button>
    </div>

    <div v-if="badges.length" class="recent-badges__grid">
      <button
        v-for="badge in badges"
        :key="badge.id"
        class="recent-badges__badge"
        @click="$emit('badge-click', badge)"
      >
        <span class="recent-badges__icon">{{ badge.icon }}</span>
        <span class="recent-badges__label">{{ badge.label }}</span>
      </button>
    </div>

    <button v-else class="recent-badges__empty" @click="$emit('view-all')">
      <span>{{ emptyText }}</span>
      <AppIcon name="arrow-left" :width="14" :height="14" class="recent-badges__arrow" />
    </button>
  </section>
</template>

<style lang="scss" scoped>
.recent-badges {
  display: flex;
  flex-direction: column;
  gap: $gap-sm;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__count {
    color: $orange;
    margin-left: $gap-xs;
  }

  &__more {
    @include title-sm;
    color: $orange;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $gap-sm;
  }

  &__badge {
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-md;
    padding: $padding-sm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $gap-xxs;
    text-align: center;
    transition: background 0.15s;

    &:active { background: rgba(255, 255, 255, 0.09); }
  }

  &__icon {
    @include title-xxl;
    line-height: 1;
  }

  &__label {
    @include title-xs;
    color: $muted;
    line-height: 1.3;
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-md;
    padding: $padding-md;
    @include title-sm;
    color: $muted;
    transition: background 0.15s;

    &:active { background: rgba(255, 255, 255, 0.08); }
  }

  &__arrow {
    color: rgba(255, 255, 255, 0.6);
    transform: rotate(180deg);
    flex-shrink: 0;
  }
}

@media (min-width: $bp-laptop) {
  .recent-badges {
    &__title { @include title-md; }
    &__more  { @include title-md; }
    &__grid  { gap: $gap-md; }

    &__badge {
      padding: $padding-md;
      gap: $gap-xs;
    }

    &__icon  { @include title-xxl; }
    &__label { @include title-sm; }

    &__empty { @include title-md; }
  }
}
</style>
