<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BADGES, BADGE_CATEGORIES } from '../data/badges.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useDbStore } from '../store/dbStore.js'
import AppIcon from '../components/AppIcon.vue'
import BadgeDetailModal from '../components/badges/BadgeDetailModal.vue'
import BadgeIcon from '../components/badges/BadgeIcon.vue'
import IconButton from '../components/IconButton.vue'
import SectionTitle from '../components/SectionTitle.vue'

const router      = useRouter()
const badgeStore  = useBadgeStore()
const dbStore     = useDbStore()
const { getBadgeProgress } = badgeStore

const userBadges    = ref([])
const stats         = ref(null)
const selectedBadge = ref(null)
const showModal     = ref(false)

onMounted(async () => {
  const [b, s] = await Promise.all([badgeStore.fetchUserBadges(), dbStore.fetchProfileStats()])
  userBadges.value = b
  stats.value      = s
})

// Badge enrichi avec unlockedAt si débloqué
function enrichBadge(badge) {
  const unlocked = userBadges.value.find(b => b.id === badge.id)
  return { ...badge, unlockedAt: unlocked?.unlockedAt ?? null }
}

// Badges groupés par catégorie
const categories = computed(() =>
  BADGE_CATEGORIES.map(cat => {
    const badges = BADGES.filter(b => b.category === cat.name).map(enrichBadge)
    return { ...cat, badges, unlocked: badges.filter(b => b.unlockedAt).length }
  })
)

function progressPercent(badge) {
  const p = getBadgeProgress(badge.id, stats.value)
  return p ? Math.min(Math.round((p.current / p.target) * 100), 100) : null
}

function openBadge(badge) {
  selectedBadge.value = badge
  showModal.value     = true
}

const selectedProgress = computed(() =>
  selectedBadge.value && !selectedBadge.value.unlockedAt
    ? getBadgeProgress(selectedBadge.value.id, stats.value)
    : null
)

const unlockedCount = computed(() => userBadges.value.length)
const percent = computed(() => Math.round((unlockedCount.value / BADGES.length) * 100))
</script>

<template>
  <div class="badges">
    <header class="badges__header">
      <div class="badges__header-row">
        <div class="badges__heading">
          <IconButton icon="arrow-left" label="Retour" variant="bare" light @click="router.back()" />
          <h1 class="badges__title">Badges</h1>
        </div>
        <div class="badges__total">
          <span class="badges__total-value">{{ unlockedCount }}<span class="badges__total-max"> / {{ BADGES.length }}</span></span>
          <span class="badges__total-label badges__total-label--count">badges obtenus</span>
        </div>
      </div>
      <div class="badges__progress">
        <div class="badges__bar"><div class="badges__fill" :style="{ width: `${percent}%` }" /></div>
        <span class="badges__total-label badges__total-label--bar">badges obtenus</span>
      </div>
    </header>

    <main class="badges__main">
      <section class="badges__summary" aria-label="Résumé par catégorie">
        <div v-for="cat in categories" :key="cat.name" class="badges__tile" :style="{ '--cat-color': cat.color }">
          <span class="badges__tile-name">{{ cat.name }}</span>
          <span class="badges__tile-count">{{ cat.unlocked }}<span class="badges__tile-max"> / {{ cat.badges.length }}</span></span>
          <span class="badges__tile-bar"><span class="badges__tile-fill" :style="{ width: `${Math.round(cat.unlocked / cat.badges.length * 100)}%` }" /></span>
        </div>
      </section>

      <section v-for="cat in categories" :key="cat.name" class="badges__category">
        <SectionTitle :title="cat.name" :count="`${cat.unlocked} / ${cat.badges.length}`" ruled class="badges__category-title" :style="{ '--cat-color': cat.color }" />

        <div class="badges__grid">
          <button
            v-for="badge in cat.badges"
            :key="badge.id"
            class="badges__item"
            :class="{ 'badges__item--locked': !badge.unlockedAt }"
            :aria-label="badge.label"
            :style="{ '--cat-color': cat.color }"
            @click="openBadge(badge)"
          >
            <BadgeIcon :badge="badge" :locked="!badge.unlockedAt" class="badges__item-icon" />
            <span class="badges__item-label">{{ badge.label }}</span>

            <span v-if="badge.unlockedAt" class="badges__item-state badges__item-state--done">
              <AppIcon name="check" :width="14" :height="14" />
              Obtenu
            </span>
            <span v-else-if="progressPercent(badge) !== null" class="badges__item-progress">
              <span class="badges__item-bar"><span class="badges__item-fill" :style="{ width: `${progressPercent(badge)}%` }" /></span>
              <span class="badges__item-percent">{{ progressPercent(badge) }}%</span>
            </span>
            <span v-else class="badges__item-state">
              <AppIcon name="lock" :width="12" :height="12" />
              À débloquer
            </span>
          </button>
        </div>
      </section>
    </main>

    <BadgeDetailModal
      :show="showModal"
      :badge="selectedBadge"
      :progress="selectedProgress"
      @close="showModal = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.badges {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: calc(#{$padding-xl} + env(safe-area-inset-top)) $padding-md $padding-md;
    background: $black;
    color: $bg;
  }

  &__header-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    margin-left: -4px; // cancels the bare IconButton padding so the arrow lines up with the content edge
  }

  &__title {
    @include title-xxxl;
    line-height: 0.9;
  }

  &__total {
    display: flex;
    align-items: flex-end;
    gap: $gap-sm;
  }

  &__total-value {
    @include title-xxxl;
    line-height: 0.9;
  }

  &__total-max {
    @include title-xl;
    opacity: 0.6;
  }

  &__total-label {
    @include text-xs;
    opacity: 0.75;

    &--count { display: none; }
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__bar {
    flex: 1;
    height: 8px;
    border-radius: $radius-xs;
    background: rgba($bg, 0.2);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $error-light;
  }

  &__summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__tile {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    padding: $padding-sm;
    border-radius: $radius-xs;
    background: var(--cat-color);
    color: $white;
  }

  &__tile-name {
    @include title-lg;
    line-height: 1;
  }

  &__tile-count {
    @include title-xxxl;
    line-height: 0.9;
  }

  &__tile-max {
    @include title-lg;
    opacity: 0.8;
  }

  &__tile-bar {
    height: 6px;
    border-radius: $radius-xs;
    background: rgba($white, 0.3);
    overflow: hidden;
  }

  &__tile-fill {
    display: block;
    height: 100%;
    background: $white;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
    padding: $padding-lg $padding-md 0;
    @include nav-safe-bottom;
  }

  &__category {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  // Coloured square before the category name
  &__category-title :deep(.section-title__text)::before {
    content: '';
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: $gap-xs;
    border-radius: $radius-xs;
    background: var(--cat-color);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
    min-height: 148px;
    padding: $padding-sm $padding-xxs $padding-xs;
    background: $surface;
    border: $border-md solid $surface;
    border-radius: $radius-sm;
    color: $text-color;
    text-align: center;
    transition: border-color 0.15s;

    &:active { border-color: $black; }

    &--locked {
      background: transparent;
      border-color: $border-color;
      color: $muted;
    }
  }

  &__item-icon { --badge-icon-size: 64px; }

  &__item-label {
    @include title-sm;
    flex: 1;
    line-height: 1.05;
    text-transform: uppercase;
    hyphens: auto;
  }

  &__item-state {
    @include text-xxs;
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    color: $muted;

    &--done {
      font-weight: 600;
      color: $accent;
    }
  }

  &__item-progress {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    width: 100%;
  }

  &__item-bar {
    flex: 1;
    height: 6px;
    border-radius: $radius-xs;
    background: $border-color;
    overflow: hidden;
  }

  &__item-fill {
    display: block;
    height: 100%;
    background: var(--cat-color);
  }

  &__item-percent {
    @include text-xxs;
    font-weight: 600;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .badges {
    &__header {
      gap: $gap-md;
      padding: calc(#{$padding-xl} + env(safe-area-inset-top)) $padding-xxl $padding-lg;
    }

    &__title { @include display-xs; }
    &__total-value { @include display-xs; }
    &__total-max { @include title-xxxl; }
    &__total-label { @include text-sm; }
    &__total-label--count { display: inline; padding-bottom: $padding-xs; }
    &__total-label--bar { display: none; }
    &__bar { height: 10px; }

    &__main {
      width: 100%;
      max-width: 1440px;
      margin: 0 auto;
      gap: $gap-xl;
      padding: $padding-xl $padding-xxl 0;
      @include nav-safe-bottom($padding-xl);
    }

    &__summary {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: $gap-sm;
    }

    &__tile { padding: $padding-md; }
    &__tile-name { @include title-xl; }
    &__tile-count { @include display-xs; }
    &__tile-max { @include title-xl; }

    &__grid {
      grid-template-columns: repeat(8, minmax(0, 1fr));
      gap: $gap-sm;
    }
  }
}
</style>
