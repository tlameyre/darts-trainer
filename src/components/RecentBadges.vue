<script setup>
import { computed } from 'vue'
import { BADGES } from '../data/badges.js'
import SectionTitle from './SectionTitle.vue'

const props = defineProps({
  badges:    { type: Array,  required: true },
  emptyText: { type: String, default: 'Aucun badge encore — commence à jouer !' },
})

defineEmits(['badge-click', 'view-all'])

const recentBadges = computed(() => props.badges.slice(0, 4))

const DAY_MS = 24 * 60 * 60 * 1000

function unlockedWhen(iso) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / DAY_MS)
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <section class="recent-badges">
    <SectionTitle title="Badges" action="Voir tout" @action="$emit('view-all')">
      <span class="recent-badges__count">{{ badges.length }}/{{ BADGES.length }}</span>
    </SectionTitle>

    <template v-if="badges.length">
      <span class="recent-badges__caption">Derniers obtenus</span>
      <div class="recent-badges__grid">
        <button
          v-for="badge in recentBadges"
          :key="badge.id"
          class="recent-badges__badge"
          @click="$emit('badge-click', badge)"
        >
          <span class="recent-badges__icon">{{ badge.icon }}</span>
          <span class="recent-badges__label">{{ badge.label }}</span>
          <span class="recent-badges__when">{{ unlockedWhen(badge.unlockedAt) }}</span>
        </button>
      </div>
    </template>

    <button v-else class="recent-badges__empty" @click="$emit('view-all')">{{ emptyText }}</button>
  </section>
</template>

<style lang="scss" scoped>
.recent-badges {
  display: flex;
  flex-direction: column;
  gap: $gap-xs;

  &__count {
    margin-left: $gap-xxs;
    color: $error;
  }

  &__caption {
    @include text-xs;
    font-weight: 600;
    letter-spacing: $tracking-lg;
    text-transform: uppercase;
    color: $muted;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
    padding: $padding-sm $padding-xxs $padding-xs;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    background: $surface;
    color: $text-color;
    text-align: center;
    transition: background 0.15s;

    &:active { background: $border-color; }
  }

  &__icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $bg;
    @include text-xl;
  }

  &__label {
    @include title-sm;
    line-height: 1.05;
    hyphens: auto;
  }

  &__when {
    @include text-xxs;
    color: $muted;
  }

  &__empty {
    padding: $padding-md;
    border-radius: $radius-sm;
    background: $surface;
    @include text-sm;
    color: $muted;
    text-align: left;
  }
}

@media (min-width: $bp-laptop) {
  .recent-badges {
    &__caption { @include text-sm; font-weight: 600; }

    &__icon {
      width: 48px;
      height: 48px;
      @include text-xxl;
    }

    &__label { @include title-md; line-height: 1.05; }
    &__when { @include text-xs; }
    &__empty { @include text-md; }
  }
}
</style>
