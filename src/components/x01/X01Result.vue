<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import AppTabs from '../AppTabs.vue'
import X01MatchStats from './X01MatchStats.vue'
import X01CheckoutReview from './X01CheckoutReview.vue'

const props = defineProps({
  matchStats:  { type: Object,  default: null }, // sortie de buildMatchStats()
  title:       { type: String,  default: 'Bien joué !' },
  subtitle:    { type: String,  default: '' },
  emoji:       { type: String,  default: '🏆' },
  titleColor:  { type: String,  default: null }, // 'orange' pour une défaite face à l'IA
  replayLabel: { type: String,  default: 'Rejouer' },
  hideActions: { type: Boolean, default: false },
  checkoutAnalysis: { type: Object, default: null }, // sortie de analyzeLegs()
})

defineEmits(['replay', 'home'])

const rootEl     = ref(null)
const sliderEl   = ref(null)
const currentTab = ref(0)

// One swipeable slide per tab: Match, Leg 1…N, Checkouts
const tabs = computed(() => [
  { id: 'match', label: 'Match' },
  ...(props.matchStats?.legs ?? []).map(l => ({ id: `leg-${l.number}`, label: `Leg ${l.number}` })),
  ...(props.checkoutAnalysis ? [{ id: 'checkouts', label: 'Checkouts' }] : []),
])

const currentTabId = computed({
  get: () => tabs.value[currentTab.value]?.id ?? 'match',
  set: (id) => goToTab(tabs.value.findIndex(t => t.id === id)),
})

// Keep the active tab visible in the tab bar when changing slide by swipe
watch(currentTab, async () => {
  await nextTick()
  rootEl.value?.querySelector('.app-tabs__tab--active')
    ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
})

let rafId = null
function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    if (!sliderEl.value) return
    currentTab.value = Math.round(sliderEl.value.scrollLeft / sliderEl.value.offsetWidth)
  })
}

function goToTab(idx) {
  sliderEl.value?.scrollTo({ left: idx * sliderEl.value.offsetWidth, behavior: 'smooth' })
}

onMounted(() => sliderEl.value?.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => sliderEl.value?.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="result" ref="rootEl">

    <div class="result__top">
      <div class="result__emoji">{{ emoji }}</div>
      <h2 class="result__title" :class="{ 'result__title--orange': titleColor === 'orange' }">
        {{ title }}
      </h2>
      <p v-if="subtitle" class="result__subtitle">{{ subtitle }}</p>
    </div>

    <div v-if="matchStats" class="result__tabs">

      <AppTabs v-if="tabs.length > 1" v-model="currentTabId" :tabs="tabs" scrollable />

      <div class="result__slider" ref="sliderEl">
        <div class="result__slide">
          <X01MatchStats :players="matchStats.players" :stats="matchStats.match" />
        </div>

        <div v-for="leg in matchStats.legs" :key="leg.number" class="result__slide">
          <X01MatchStats :players="matchStats.players" :stats="leg.players" :leg="leg" />
        </div>

        <div v-if="checkoutAnalysis" class="result__slide">
          <X01CheckoutReview :analysis="checkoutAnalysis" />
        </div>
      </div>

    </div>

    <p v-else class="result__no-stats">
      Aucune volée enregistrée cette partie.
    </p>

    <div v-if="!hideActions" class="result__actions">
      <button class="result__btn result__btn--secondary" @click="$emit('home')">
        Retour au lobby
      </button>
      <button class="result__btn result__btn--primary" @click="$emit('replay')">
        {{ replayLabel }}
      </button>
    </div>

  </div>
</template>

<style lang="scss" scoped>
.result {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: $gap-lg;
  padding: $padding-lg 0;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &__top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xs;
  }

  &__emoji  { @include display-xs; line-height: 1; }

  &__title {
    @include title-xxl;
    color: $text-color;
    text-align: center;

    &--orange { color: $orange-dark; }
  }

  &__subtitle {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  // ── Wrapper tabs + slider ─────────────────────────────────────────────────
  &__tabs {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  &__slider {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }
  }

  &__slide {
    scroll-snap-align: start;
    flex-shrink: 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  &__no-stats {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-lg 0;
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  &__actions {
    display: flex;
    gap: $gap-md;
    margin-top: auto;
    padding: 0 $padding-md;
  }

  &__btn {
    flex: 1;
    padding: $padding-md;
    border-radius: $radius-sm;
    @include title-md;
    font-weight: 700;
    text-transform: uppercase;
    transition: opacity 0.15s;

    &:active { opacity: 0.75; }

    &--primary   { background: $orange; color: $white; }
    &--secondary { background: rgba($white, 0.08); color: $text-color; }
  }
}

@media (min-width: $bp-laptop) {
  .result {
    gap: $gap-xl;

    &__title    { @include display-xs; }
    &__subtitle { @include text-md; }

    &__slide    { padding: 0 $padding-xxl; }
    &__actions  { padding: 0 $padding-xxl; }

    &__btn { @include title-lg; }
  }
}
</style>
