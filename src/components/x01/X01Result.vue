<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import StatCell from '../StatCell.vue'

const props = defineProps({
  stats:      { type: Object,  default: null },
  legsPlayed: { type: Number,  required: true },
  startScore: { type: Number,  required: true },
  aiWon:      { type: Boolean, default: false },
  aiLegsWon:  { type: Number,  default: 0 },
})

defineEmits(['replay', 'home'])

const sliderEl   = ref(null)
const currentTab = ref(0)
const TAB_COUNT  = 3
const VOLLEY_BUCKETS = ['40', '60', '80', '100', '120', '140', '160', '180']

const checkoutPct = computed(() => {
  if (!props.stats?.doublesAttempted) return null
  return Math.round((props.stats.doublesHit / props.stats.doublesAttempted) * 100)
})

const maxBucketCount = computed(() =>
  Math.max(1, ...VOLLEY_BUCKETS.map(k => props.stats?.volleyDistribution?.[k] ?? 0))
)

const maxLegAvg = computed(() =>
  Math.max(1, ...(props.stats?.legAverages?.map(l => l.avg) ?? []))
)

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
  <div class="result">

    <div class="result__top">
      <div class="result__emoji">{{ aiWon ? '🤖' : '🏆' }}</div>
      <h2 class="result__title" :class="{ 'result__title--ai': aiWon }">
        {{ aiWon ? 'L\'IA a gagné la partie !' : 'Bien joué !' }}
      </h2>
      <p class="result__subtitle">
        {{ startScore }} pts ·
        <template v-if="aiWon">
          {{ aiLegsWon }} manche{{ aiLegsWon > 1 ? 's' : '' }} remportée{{ aiLegsWon > 1 ? 's' : '' }} par l'IA
        </template>
        <template v-else>
          {{ legsPlayed }} manche{{ legsPlayed > 1 ? 's' : '' }}
        </template>
      </p>
    </div>

    <div v-if="stats" class="result__tabs">

      <div class="result__dots">
        <button
          v-for="i in TAB_COUNT"
          :key="i"
          class="result__dot"
          :class="{ 'result__dot--active': currentTab === i - 1 }"
          @click="goToTab(i - 1)"
          :aria-label="`Onglet ${i}`"
        />
      </div>

      <div class="result__slider" ref="sliderEl">

        <!-- Tab 1 : Stats globales -->
        <div class="result__slide">
          <p class="result__slide-title">Stats globales</p>

          <div class="result__row">
            <StatCell :value="stats.avgVolley" label="Moy. par volée"    highlight />
            <StatCell :value="stats.avg9darts" label="Moy. 9 fléchettes" highlight />
          </div>

          <div class="result__row">
            <StatCell :value="`${stats.doublesHit}/${stats.doublesAttempted || '?'}`" label="Aux doubles" />
            <StatCell :value="checkoutPct != null ? checkoutPct + ' %' : '–'" label="% de finish" />
            <StatCell :value="stats.highestFinish || '–'" label="Plus haut finish" />
          </div>

          <div class="result__row">
            <StatCell :value="stats.highestVolley || '–'" label="Meilleure volée" />
            <div v-if="stats.bestLeg" class="result__leg-cell">
              <div class="result__leg">
                <span class="result__leg-darts">{{ stats.bestLeg.darts }}</span>
                <span class="result__leg-label">fléchettes</span>
                <span v-if="stats.bestLeg.checkoutScore != null" class="result__leg-finish">finish {{ stats.bestLeg.checkoutScore }}</span>
              </div>
              <span class="result__leg-title">Meilleure manche</span>
            </div>
            <div v-if="stats.worstLeg" class="result__leg-cell">
              <div class="result__leg">
                <span class="result__leg-darts">{{ stats.worstLeg.darts }}</span>
                <span class="result__leg-label">fléchettes</span>
                <span v-if="stats.worstLeg.checkoutScore != null" class="result__leg-finish">finish {{ stats.worstLeg.checkoutScore }}</span>
              </div>
              <span class="result__leg-title">Pire manche</span>
            </div>
          </div>
        </div>

        <!-- Tab 2 : Distribution des volées -->
        <div class="result__slide">
          <p class="result__slide-title">Volées</p>
          <div class="result__distrib">
            <div
              v-for="bucket in VOLLEY_BUCKETS"
              :key="bucket"
              class="result__distrib-row"
            >
              <span class="result__distrib-label">{{ bucket === '180' ? '180' : bucket + '+' }}</span>
              <div class="result__distrib-track">
                <div
                  class="result__distrib-bar"
                  :style="{ width: ((stats.volleyDistribution?.[bucket] ?? 0) / maxBucketCount * 100) + '%' }"
                />
              </div>
              <span class="result__distrib-count">{{ stats.volleyDistribution?.[bucket] ?? 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Tab 3 : Progression par manche -->
        <div class="result__slide">
          <p class="result__slide-title">Par manche</p>
          <div class="result__legs">
            <div
              v-for="item in stats.legAverages"
              :key="item.leg"
              class="result__leg-row"
            >
              <span class="result__leg-num">M{{ item.leg }}</span>
              <div class="result__leg-track">
                <div
                  class="result__leg-bar"
                  :style="{ width: (item.avg / maxLegAvg * 100) + '%' }"
                />
              </div>
              <span class="result__leg-avg">{{ item.avg }}</span>
            </div>
          </div>
        </div>

      </div>

    </div>

    <p v-else class="result__no-stats">
      Tu n'as pas terminé de manche cette partie.
    </p>

    <div class="result__actions">
      <button class="result__btn result__btn--secondary" @click="$emit('home')">
        Retour au lobby
      </button>
      <button class="result__btn result__btn--primary" @click="$emit('replay')">
        Rejouer
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
    color: $white;
    text-align: center;

    &--ai { color: $orange; }
  }

  &__subtitle {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  // ── Wrapper dots + slider ─────────────────────────────────────────────────
  &__tabs {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  // ── Dots ─────────────────────────────────────────────────────────────────
  &__dots {
    display: flex;
    justify-content: center;
    gap: $gap-sm;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: rgba($white, 0.2);
    transition: background 0.2s, transform 0.2s;

    &--active {
      background: $orange;
      transform: scale(1.3);
    }
  }

  // ── Slider ────────────────────────────────────────────────────────────────
  &__slider {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow-x: scroll;
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
    padding: 0 $padding-md;
  }

  &__slide-title {
    @include title-xs;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: center;
  }

  // ── Tab 1 : stats rows ────────────────────────────────────────────────────
  &__row {
    display: flex;
    gap: $gap-sm;
  }

  &__leg-cell {
    flex: 1;
    background: rgba($white, 0.06);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: $gap-xxs;
    min-width: 0;
  }

  &__leg {
    display: flex;
    align-items: baseline;
    gap: $gap-xs;
    flex-wrap: wrap;
  }

  &__leg-darts  { @include title-xl; font-weight: 700; color: $white; line-height: 1; font-variant-numeric: tabular-nums; }
  &__leg-label  { @include text-xxs; color: rgba($white, 0.6); }
  &__leg-finish { @include text-xxs; color: $muted; white-space: nowrap; }
  &__leg-title  { @include text-xxs; color: $muted; line-height: 1.3; }

  // ── Tab 2 : distribution des volées ──────────────────────────────────────
  &__distrib {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__distrib-row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__distrib-label {
    @include title-sm;
    color: $muted;
    width: 36px;
    text-align: right;
    flex-shrink: 0;
  }

  &__distrib-track {
    flex: 1;
    height: 8px;
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__distrib-bar {
    height: 100%;
    background: $orange;
    border-radius: $radius-pill;
    transition: width 0.4s ease;
    min-width: 0;
  }

  &__distrib-count {
    @include title-sm;
    color: $white;
    font-variant-numeric: tabular-nums;
    width: 24px;
    text-align: right;
    flex-shrink: 0;
  }

  // ── Tab 3 : par manche ────────────────────────────────────────────────────
  &__legs {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
    overflow-y: auto;
  }

  &__leg-row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__leg-num {
    @include title-sm;
    color: $muted;
    width: 28px;
    flex-shrink: 0;
  }

  &__leg-track {
    flex: 1;
    height: 8px;
    background: rgba($white, 0.08);
    border-radius: $radius-pill;
    overflow: hidden;
  }

  &__leg-bar {
    height: 100%;
    background: $accent;
    border-radius: $radius-pill;
    transition: width 0.4s ease;
  }

  &__leg-avg {
    @include title-sm;
    color: $white;
    font-variant-numeric: tabular-nums;
    width: 28px;
    text-align: right;
    flex-shrink: 0;
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
    &--secondary { background: rgba($white, 0.08); color: $white; }
  }
}

@media (min-width: $bp-laptop) {
  .result {
    gap: $gap-xl;

    &__title    { @include display-xs; }
    &__subtitle { @include text-md; }

    &__slide    { padding: 0 $padding-xxl; }
    &__actions  { padding: 0 $padding-xxl; }

    &__slide-title { @include title-sm; }

    &__leg-darts   { @include title-xxl; }
    &__leg-label   { @include text-xs; }
    &__leg-finish  { @include text-xs; }
    &__leg-title   { @include text-xs; }

    &__distrib-label { @include title-md; width: 44px; }
    &__distrib-count { @include title-md; width: 32px; }
    &__distrib-track { height: 12px; }

    &__leg-avg   { @include title-md; width: 36px; }
    &__leg-track { height: 12px; }

    &__btn { @include title-lg; }
  }
}
</style>
