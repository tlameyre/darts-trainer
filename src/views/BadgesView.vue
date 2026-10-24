<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BADGES, BADGE_CATEGORIES } from '../data/badges.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useDbStore } from '../store/dbStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import BadgeDetailModal from '../components/badges/BadgeDetailModal.vue'
import BadgeIcon from '../components/badges/BadgeIcon.vue'
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
    <AppHeader title="BADGES" tone="ink" @back="router.back()" />

    <section class="badges__progress" aria-label="Progression">
      <div class="badges__total">
        <span class="badges__total-value">{{ unlockedCount }}<span class="badges__total-max"> / {{ BADGES.length }}</span></span>
        <span class="badges__total-label">badges obtenus</span>
      </div>
      <div class="badges__bar"><div class="badges__fill" :style="{ width: `${percent}%` }" /></div>
    </section>

    <main class="badges__main">
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

  &__progress {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    padding: 0 $padding-md $padding-lg;
    background: $black;
    color: $bg;
  }

  &__total {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  &__total-value {
    @include display-xs;
    line-height: 0.9;
  }

  &__total-max {
    @include title-xxl;
    opacity: 0.6;
  }

  &__total-label {
    @include text-xs;
    padding-bottom: $padding-xxs;
    opacity: 0.75;
  }

  &__bar {
    height: 8px;
    border-radius: $radius-xs;
    background: rgba($bg, 0.2);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: $error-light;
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
    min-height: 124px;
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

  &__item-icon { --badge-icon-size: 40px; }

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
    &__progress { padding: 0 $padding-xxl $padding-xl; }
    &__total-value { @include display-sm; }
    &__total-max { @include title-xxxl; }
    &__total-label { @include text-sm; }
    &__bar { height: 10px; }

    &__main {
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      gap: $gap-xxl;
      padding: $padding-xxl 0 0;
      @include nav-safe-bottom($padding-xl);
    }

    &__grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: $gap-sm;
    }

    &__item { min-height: 148px; padding: $padding-md $padding-xxs $padding-sm; }
    &__item-icon { --badge-icon-size: 52px; }
    &__item-label { @include title-md; }
    &__item-state, &__item-percent { @include text-xs; }
  }
}
</style>
