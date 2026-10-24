<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import { CHECKOUT_SCORES, CHECKOUT_BRACKETS, CHECKOUT_DATA_SOURCE } from '../composables/useCheckouts.js'

const router = useRouter()

const groups = computed(() =>
  CHECKOUT_BRACKETS
    .map((b) => ({
      label: b.label,
      points: b.points,
      scores: CHECKOUT_SCORES.filter((s) => s >= b.range[0] && s <= b.range[1]),
    }))
    .filter((g) => g.scores.length > 0),
)

const activeGroup = ref(groups.value[0]?.label)
const sectionEls = {}

function jumpTo(label) {
  activeGroup.value = label
  sectionEls[label]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function openScore(score) {
  router.push({ name: 'checkout-wiki-detail', params: { score } })
}

// Reachable from the home, /play or the checkout settings: go back where we came from
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <div class="wiki">
    <AppHeader title="Checkouts" tone="ink" @back="goBack" />

    <div class="wiki__body">
      <aside class="wiki__aside">
        <p class="wiki__intro">Toutes les sorties de 2 à 170. Touche un score pour voir la cible et les routes.</p>
        <nav class="wiki__jump" aria-label="Tranches">
          <span class="wiki__jump-title">Tranches</span>
          <button
            v-for="group in groups"
            :key="group.label"
            type="button"
            class="wiki__chip"
            :class="{ 'wiki__chip--active': activeGroup === group.label }"
            @click="jumpTo(group.label)"
          >
            <span class="wiki__chip-label">{{ group.label }}</span>
            <span class="wiki__chip-count">{{ group.scores.length }} sorties</span>
          </button>
        </nav>
        <p class="wiki__source">Données : {{ CHECKOUT_DATA_SOURCE }}</p>
      </aside>

      <main class="wiki__main">
        <section
          v-for="group in groups"
          :key="group.label"
          :ref="(el) => { sectionEls[group.label] = el }"
          class="wiki__group"
        >
          <div class="wiki__group-head">
            <h2 class="wiki__group-title">{{ group.label }}</h2>
            <span class="wiki__group-meta">
              {{ group.scores.length }} sorties · {{ group.points }} pt{{ group.points > 1 ? 's' : '' }}
            </span>
          </div>
          <div class="wiki__grid">
            <button
              v-for="score in group.scores"
              :key="score"
              type="button"
              class="wiki__card"
              @click="openScore(score)"
            >
              {{ score }}
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wiki {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
    padding: $padding-lg $padding-md 0;
    @include nav-safe-bottom;
  }

  &__aside {
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
  }

  &__intro {
    @include text-sm;
    line-height: 1.4;
    color: $muted;
  }

  &__jump {
    display: flex;
    gap: $gap-xs;
    margin: 0 (-$padding-md);
    padding: 0 $padding-md;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }
  }

  &__jump-title,
  &__chip-count {
    display: none;
  }

  &__chip {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $padding-xxs $padding-xs;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;

    &--active {
      background: $black;
      border-color: $black;
      color: $bg;
    }
  }

  &__chip-label { @include title-sm; }

  &__source { display: none; }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
    scroll-margin-top: $padding-md;
  }

  &__group-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: $padding-xxs;
    border-bottom: $border-lg solid $text-color;
  }

  &__group-title { @include title-lg; }

  &__group-meta {
    @include text-xs;
    color: $muted;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $gap-xs;
  }

  &__card {
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: $border-md solid $border-color;
    border-radius: $radius-sm;
    color: $text-color;
    @include title-xl;
    font-variant-numeric: tabular-nums;
    transition: border-color 0.15s, transform 0.1s;

    &:hover { border-color: $text-color; }
    &:active { transform: scale(0.95); }
  }
}

@media (min-width: $bp-laptop) {
  // Bracket index on the left, every score grid on the right
  .wiki {
    &__body {
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
      align-items: start;
      gap: $gap-xxl + $gap-xs;
      padding: $padding-xxl $padding-xxl 0;
      @include nav-safe-bottom($padding-xl);
    }

    &__aside {
      position: sticky;
      top: $padding-xxl;
      gap: $gap-lg;
    }

    &__intro { @include text-md; line-height: 1.45; }

    &__jump {
      flex-direction: column;
      margin: 0;
      padding: 0;
      overflow: visible;
    }

    &__jump-title {
      display: block;
      @include title-sm;
      color: $muted;
    }

    &__chip {
      padding: $padding-xs $padding-sm;
      transition: border-color 0.15s;

      &:hover:not(.wiki__chip--active) { border-color: $text-color; }
    }

    &__chip-label { @include title-lg; }

    &__chip-count {
      display: block;
      @include text-sm;
      opacity: 0.75;
    }

    &__source {
      display: block;
      @include text-sm;
      color: $muted;
    }

    &__main        { gap: $gap-xxl; }
    &__group-title { @include title-xxl; }
    &__group-meta  { @include text-md; }
    &__grid        { grid-template-columns: repeat(10, minmax(0, 1fr)); }
    &__card        { height: 56px; @include title-xxl; }
  }
}
</style>
