<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GAME_MODES } from '../data/gameModes.js'
import PageHeader from '../components/PageHeader.vue'
import SectionTitle from '../components/SectionTitle.vue'
import AppTabs from '../components/AppTabs.vue'
import PlayModeCard from '../components/play/PlayModeCard.vue'

const route  = useRoute()
const router = useRouter()

const FILTERS = [
  { id: 'all',    label: 'Tous' },
  { id: 'solo',   label: 'Seul' },
  { id: 'multi',  label: 'À plusieurs' },
  { id: 'online', label: 'En ligne' },
]

// The home shortcuts deep-link to a filter
const filter = ref(FILTERS.some(f => f.id === route.query.filter) ? route.query.filter : 'all')

const WIKI_TILE = {
  label: 'Encyclopédie', icon: 'book', color: '#14110F', settingsRoute: 'checkout-wiki',
  description: 'Toutes les routes de checkout, de 2 à 170.', players: 'solo',
}

const groups = computed(() => {
  const visible = modes => modes.filter(m => filter.value === 'all' || m.players === filter.value)
  return [
    { title: "S'entraîner", modes: visible([...GAME_MODES.filter(m => m.group === 'train'), WIKI_TILE]) },
    { title: 'Jouer',       modes: visible(GAME_MODES.filter(m => m.group !== 'train')) },
  ].filter(g => g.modes.length)
})
</script>

<template>
  <div class="lobby">
    <PageHeader title="Jouer" />

    <main class="lobby__main">
      <AppTabs v-model="filter" :tabs="FILTERS" variant="filter" scrollable />

      <div class="lobby__groups">
        <section v-for="group in groups" :key="group.title" class="lobby__group">
          <SectionTitle :title="group.title" />
          <div class="lobby__cards">
            <PlayModeCard
              v-for="mode in group.modes" :key="mode.label"
              :mode="mode" :description="mode.description"
              @select="router.push({ name: mode.settingsRoute })"
            />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.lobby {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding: $padding-md $padding-md 0;
    @include nav-safe-bottom;
  }

  &__groups {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    min-width: 0;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }
}

@media (min-width: $bp-laptop) {
  .lobby {
    &__main {
      padding: $padding-xl $padding-xxl 0;
      gap: $gap-lg;
      @include nav-safe-bottom($padding-xl);
    }

    &__groups {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: start;
      gap: $gap-xxl;
    }

    &__group { gap: $gap-sm; }
    &__cards { gap: $gap-sm; }
  }
}
</style>
